import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { annotations } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: annotationId } = await params
    const body = await req.json()
    const { status, resolvedBy, resolvedByName } = body

    console.log('Updating annotation status:', {
      annotationId,
      status,
      resolvedBy,
      resolvedByName
    })

    if (!status) {
      return NextResponse.json({
        status: 'error',
        message: 'Status is required'
      }, { status: 400 })
    }

    // Update annotation status
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
      return NextResponse.json({
        status: 'error',
        message: 'Annotation not found'
      }, { status: 404 })
    }

    // Emit socket event for real-time updates
    try {
      const { getSocketServer } = await import('@/lib/socket-server');
      const io = getSocketServer();
      
      if (io) {
        console.log('📡 Emitting annotationStatusUpdated event for project:', updatedAnnotation.projectId);
        io.to(`project-${updatedAnnotation.projectId}`).emit('annotationStatusUpdated', {
          annotationId: annotationId,
          projectId: updatedAnnotation.projectId,
          status: status,
          isResolved: updatedAnnotation.isResolved,
          resolvedBy: resolvedBy,
          resolvedByName: resolvedByName,
          timestamp: new Date().toISOString()
        });
        console.log('✅ Socket event emitted successfully');
      } else {
        console.log('⚠️ Socket server not available');
      }
    } catch (error) {
      console.log("Socket emission error:", error);
    }

    return NextResponse.json({
      status: 'success',
      message: 'Annotation status updated successfully',
      data: updatedAnnotation
    })

  } catch (error) {
    console.error('Update annotation status error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to update annotation status'
    }, { status: 500 })
  }
}
