import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings, annotations } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

export async function PUT(request: NextRequest) {
  try {
    const { annotationId, status, updatedBy } = await request.json()

    if (!annotationId || !status) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update annotation status using Drizzle
    const [updatedAnnotation] = await db
      .update(annotations)
      .set({
        status: status as any,
        isResolved: status === 'COMPLETED',
        updatedAt: new Date()
      })
      .where(eq(annotations.id, annotationId))
      .returning()

    if (!updatedAnnotation) {
      return NextResponse.json(
        { status: 'error', message: 'Annotation not found' },
        { status: 404 }
      )
    }

    // Note: Notification creation removed as AnnotationNotification model doesn't exist in schema

    // Emit socket event for real-time updates
    try {
      const { getSocketServer } = await import('@/lib/socket-server')
      const io = getSocketServer()
      
      if (io) {
        // Determine if this is from admin or client
        const isFromAdmin = updatedBy === 'Admin' || updatedBy?.includes('Admin')
        
        // Emit status update event
        io.to(`project-${updatedAnnotation.projectId}`).emit('annotationStatusUpdated', {
          annotationId,
          status,
          updatedBy,
          updatedByName: updatedBy,
          timestamp: new Date().toISOString(),
          isFromAdmin: isFromAdmin
        })
        
        // Send notification to opposite user type
        if (isFromAdmin) {
          // Admin changed status, notify client
          io.to(`project-${updatedAnnotation.projectId}`).emit('statusNotification', {
            type: 'status_changed',
            message: `Admin ${status.toLowerCase()} annotation`,
            from: 'Admin',
            to: 'Client',
            annotationId: annotationId,
            status: status,
            timestamp: new Date().toISOString()
          })
        } else {
          // Client changed status, notify admin
          io.to(`project-${updatedAnnotation.projectId}`).emit('statusNotification', {
            type: 'status_changed',
            message: `Client ${status.toLowerCase()} annotation`,
            from: 'Client',
            to: 'Admin',
            annotationId: annotationId,
            status: status,
            timestamp: new Date().toISOString()
          })
        }
        
        console.log(`📡 Emitted annotationStatusUpdated for annotation ${annotationId} in project ${updatedAnnotation.projectId}`)
      }
    } catch (error) {
      console.error('Error emitting socket event:', error)
    }

    return NextResponse.json({
      status: 'success',
      data: updatedAnnotation,
    })
  } catch (error) {
    console.error('Error updating annotation status:', error)
    return NextResponse.json(
      { status: 'error', message: 'Failed to update annotation status' },
      { status: 500 }
    )
  }
}
