import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSocketServer } from '@/lib/socket-server'

export async function PUT(request: NextRequest) {
  try {
    const { annotationId, status, updatedBy } = await request.json()

    if (!annotationId || !status) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update annotation status
    const annotation = await prisma.annotation.update({
      where: { id: annotationId },
      data: {
        status: status as any,
        isResolved: status === 'RESOLVED',
        resolvedBy: status === 'RESOLVED' ? updatedBy : null,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
      },
      include: {
        replies: true,
        notifications: true
      }
    })

    // Create notification for status change
    await prisma.annotationNotification.create({
      data: {
        annotationId,
        userId: annotation.addedBy, // Notify the original creator
        type: 'ANNOTATION_STATUS_CHANGED',
        message: `Annotation status changed to ${status} by ${updatedBy}`
      }
    })

    // Emit socket event for real-time updates
    try {
      const io = getSocketServer()
      if (io) {
        io.to(`project-${annotation.projectId}`).emit('annotationStatusUpdated', {
          annotationId,
          status,
          updatedBy,
          updatedByName: updatedBy,
          timestamp: new Date().toISOString()
        })
        console.log(`📡 Emitted annotationStatusUpdated for annotation ${annotationId} in project ${annotation.projectId}`)
      }
    } catch (error) {
      console.error('Error emitting socket event:', error)
    }

    return NextResponse.json({
      status: 'success',
      data: annotation,
    })
  } catch (error) {
    console.error('Error updating annotation status:', error)
    return NextResponse.json(
      { status: 'error', message: 'Failed to update annotation status' },
      { status: 500 }
    )
  }
}
