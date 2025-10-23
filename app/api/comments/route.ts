import { NextRequest, NextResponse } from 'next/server'
import { prisma, checkDatabaseConnection } from '@/lib/db'
import { sendClientMessageNotificationToAdmin, sendAdminReplyNotificationToClient } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // 30 seconds max duration

// GET - Fetch comments for a specific file
export async function GET(request: NextRequest) {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const designItemId = searchParams.get('designItemId')

    if (!designItemId) {
      return NextResponse.json({ error: "Design item ID is required" }, { status: 400 })
    }

    // Add timeout wrapper
    const comments = await Promise.race([
      prisma.comment.findMany({
        where: { designItemId: parseInt(designItemId) },
        orderBy: { createdAt: 'asc' },
        take: 100 // Limit results to prevent large queries
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 15000)
      )
    ]) as any[]

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    if (error instanceof Error && error.message === 'Query timeout') {
      return NextResponse.json({ error: "Request timeout - please try again" }, { status: 408 })
    }
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}        

// POST - Create a new comment
export async function POST(request: NextRequest) {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 })
    }

    const { 
      designItemId, 
      author, 
      authorEmail,
      isAdmin = false,
      recipientEmail, // Email of the person to notify
      content, 
      type, 
      drawingData, 
      canvasPosition,
      pdfPage 
    } = await request.json()

    if (!designItemId || !author || !content) {
      return NextResponse.json({ error: "Design item ID, author, and content are required" }, { status: 400 })
    }

    // Add timeout wrapper for comment creation
    const comment = await Promise.race([
      prisma.comment.create({
        data: {
          designItemId: parseInt(designItemId),
          author: author,
          authorEmail: authorEmail || null,
          isAdmin: isAdmin,
          content: content,
          type: type || 'comment',
          drawingData: drawingData || null,
          canvasX: canvasPosition?.x || null,
          canvasY: canvasPosition?.y || null,
          canvasWidth: canvasPosition?.width || null,
          canvasHeight: canvasPosition?.height || null,
          imageWidth: canvasPosition?.imageWidth || null,
          imageHeight: canvasPosition?.imageHeight || null,
          pdfPage: pdfPage || null
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Comment creation timeout')), 20000)
      )
    ]) as any

    // Send email notifications and handle errors
    let emailError = null
    let emailSentTo = null
    try {
      // Get design item with review and project info
      const designItem = await prisma.designItem.findUnique({
        where: { id: parseInt(designItemId) },
        include: {
          review: {
            include: {
              project: true
            }
          }
        }
      })

      if (designItem) {
        const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://preview.devnstage.xyz'}/review/${designItem.review.shareLink}`
        
        // If client sent message, notify admin
        if (!isAdmin && authorEmail) {
          const notificationData = {
            clientName: author,
            clientEmail: authorEmail, // Client's email for admin to see
            commentContent: content,
            projectName: designItem.review.project.name,
            projectNumber: designItem.review.project.projectNumber,
            reviewLink: reviewLink,
            designFileName: designItem.fileName,
            commentType: type || 'comment'
          }
          const emailResult = await sendClientMessageNotificationToAdmin(notificationData)
          if (emailResult.success) {
            emailSentTo = emailResult.emailSentTo
            console.log(`📧 Admin notification queued for client message from ${author}`)
          } else {
            emailError = 'Failed to queue admin notification email'
          }
        } 
        // If admin sent message, notify client
        else if (isAdmin && recipientEmail) {
          // Get the current client email from database to ensure we use the latest one
          const currentProject = await prisma.project.findUnique({
            where: { id: designItem.review.projectId },
            select: { clientEmail: true }
          })
          
          // Use the updated client email from database, fallback to recipientEmail
          const currentClientEmail = currentProject?.clientEmail || recipientEmail
          
          const notificationData = {
            clientName: author, // Admin's name
            clientEmail: currentClientEmail, // Use current client email from database
            commentContent: content,
            projectName: designItem.review.project.name,
            projectNumber: designItem.review.project.projectNumber,
            reviewLink: reviewLink,
            designFileName: designItem.fileName,
            commentType: type || 'comment'
          }
          const emailResult = await sendAdminReplyNotificationToClient(notificationData)
          if (emailResult.success) {
            emailSentTo = emailResult.emailSentTo
            console.log(`📧 Client notification queued for admin reply to ${currentClientEmail}`)
            
            // Emit socket event to notify admin that email was sent to updated address
            try {
              const { io } = require('../../../socket-server.js')
              if (io) {
                io.emit('adminEmailSent', {
                  projectId: designItem.review.projectId,
                  emailSentTo: currentClientEmail,
                  message: 'Email sent to updated client address'
                })
                console.log('📡 Socket event emitted for admin email sent')
              }
            } catch (socketError) {
              console.error('Failed to emit socket event:', socketError)
            }
          } else {
            emailError = 'Failed to queue client notification email'
          }
        }
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError)
      emailError = `Email notification error: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
    }

    return NextResponse.json({
      ...comment,
      emailError: emailError,
      emailSentTo: emailSentTo,
      emailStatus: emailSentTo ? 'queued' : emailError ? 'failed' : 'none'
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    if (error instanceof Error && error.message === 'Comment creation timeout') {
      return NextResponse.json({ error: "Request timeout - please try again" }, { status: 408 })
    }
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
 
