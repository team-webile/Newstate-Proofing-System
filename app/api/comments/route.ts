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

    // Optimized query with timeout
    const comments = await Promise.race([
      prisma.comment.findMany({
        where: { designItemId: parseInt(designItemId) },
        orderBy: { createdAt: 'asc' },
        take: 50, // Reduced limit for faster response
        select: {
          id: true,
          author: true,
          authorEmail: true,
          isAdmin: true,
          content: true,
          type: true,
          drawingData: true,
          canvasX: true,
          canvasY: true,
          canvasWidth: true,
          canvasHeight: true,
          imageWidth: true,
          imageHeight: true,
          pdfPage: true,
          createdAt: true
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 10000) // Reduced timeout
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

    // Optimized comment creation with shorter timeout
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
        setTimeout(() => reject(new Error('Comment creation timeout')), 10000) // Reduced timeout
      )
    ]) as any

    // Return comment immediately, send emails asynchronously
    const response = NextResponse.json({
      ...comment,
      emailSent: false, // Will be updated by async email process
      emailError: null
    })

    // Send email notifications asynchronously (don't block response)
    setImmediate(async () => {
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
          const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://review.newstatebranding.com'}/review/${designItem.review.shareLink}`
          
          // If client sent message, notify admin
          if (!isAdmin && authorEmail) {
            const notificationData = {
              clientName: author,
              clientEmail: authorEmail,
              commentContent: content,
              projectName: designItem.review.project.name,
              projectNumber: designItem.review.project.projectNumber,
              reviewLink: reviewLink,
              designFileName: designItem.fileName,
              commentType: type || 'comment'
            }
            await sendClientMessageNotificationToAdmin(notificationData)
          } 
          // If admin sent message, notify client
          else if (isAdmin && recipientEmail) {
            const notificationData = {
              clientName: author,
              clientEmail: recipientEmail,
              commentContent: content,
              projectName: designItem.review.project.name,
              projectNumber: designItem.review.project.projectNumber,
              reviewLink: reviewLink,
              designFileName: designItem.fileName,
              commentType: type || 'comment'
            }
            await sendAdminReplyNotificationToClient(notificationData)
          }
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError)
      }
    })

    return response
  } catch (error) {
    console.error('Error creating comment:', error)
    if (error instanceof Error && error.message === 'Comment creation timeout') {
      return NextResponse.json({ error: "Request timeout - please try again" }, { status: 408 })
    }
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
 