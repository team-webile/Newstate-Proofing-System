import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { annotationReplies } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// PUT - Edit a reply
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: replyId } = await params
    const { content, updatedBy, updatedByName } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json(
        { status: "error", message: "Content is required" },
        { status: 400 }
      )
    }

    // Verify reply exists
    const [existingReply] = await db
      .select()
      .from(annotationReplies)
      .where(eq(annotationReplies.id, replyId))

    if (!existingReply) {
      return NextResponse.json(
        { status: "error", message: "Reply not found" },
        { status: 404 }
      )
    }

    // Update the reply
    const [updatedReply] = await db
      .update(annotationReplies)
      .set({
        content: content.trim(),
        updatedAt: new Date(),
        isEdited: new Date()
      })
      .where(eq(annotationReplies.id, replyId))
      .returning()

    console.log("Reply updated successfully:", updatedReply)

    // Emit socket event for real-time updates
    try {
      const { getSocketServer } = await import('@/lib/socket-server')
      const io = getSocketServer()
      
      if (io) {
        console.log('📡 Emitting replyEdited event for project:', existingReply.projectId)
        io.to(`project-${existingReply.projectId}`).emit('replyEdited', {
          projectId: existingReply.projectId,
          annotationId: existingReply.annotationId,
          replyId: replyId,
          reply: {
            id: updatedReply.id,
            content: updatedReply.content,
            addedBy: updatedReply.addedBy,
            addedByName: updatedReply.addedByName,
            createdAt: updatedReply.createdAt,
            updatedAt: updatedReply.updatedAt,
            isEdited: updatedReply.isEdited
          },
          updatedBy: updatedBy || updatedByName || 'Unknown',
          updatedByName: updatedByName || updatedBy || 'Unknown',
          timestamp: new Date().toISOString()
        })
        console.log('✅ Socket event emitted successfully')
      }
    } catch (error) {
      console.log("Socket emission error:", error)
    }

    return NextResponse.json({
      status: "success",
      message: "Reply updated successfully",
      data: updatedReply
    })

  } catch (error) {
    console.error("Error updating reply:", error)
    return NextResponse.json(
      { status: "error", message: "Failed to update reply" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a reply
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: replyId } = await params

    // Verify reply exists and get project info
    const [existingReply] = await db
      .select()
      .from(annotationReplies)
      .where(eq(annotationReplies.id, replyId))

    if (!existingReply) {
      return NextResponse.json(
        { status: "error", message: "Reply not found" },
        { status: 404 }
      )
    }

    // Delete the reply
    await db
      .delete(annotationReplies)
      .where(eq(annotationReplies.id, replyId))

    console.log("Reply deleted successfully:", replyId)

    // Emit socket event for real-time updates
    try {
      const { getSocketServer } = await import('@/lib/socket-server')
      const io = getSocketServer()
      
      if (io) {
        console.log('📡 Emitting replyDeleted event for project:', existingReply.projectId)
        io.to(`project-${existingReply.projectId}`).emit('replyDeleted', {
          projectId: existingReply.projectId,
          annotationId: existingReply.annotationId,
          replyId: replyId,
          timestamp: new Date().toISOString()
        })
        console.log('✅ Socket event emitted successfully')
      }
    } catch (error) {
      console.log("Socket emission error:", error)
    }

    return NextResponse.json({
      status: "success",
      message: "Reply deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting reply:", error)
    return NextResponse.json(
      { status: "error", message: "Failed to delete reply" },
      { status: 500 }
    )
  }
}
