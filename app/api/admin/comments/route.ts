import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
import { withAuth } from '@/lib/auth'

// Extend global to include io
declare global {
  var io: any
}

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const elementId = url.searchParams.get('elementId')
    const projectId = url.searchParams.get('projectId')

    let comments
    if (elementId) {
      comments = await CommentModel.getCommentsWithReplies(elementId)
    } else if (projectId) {
      // Get all comments for a project
      comments = await CommentModel.findAll()
    } else {
      comments = await CommentModel.findAll()
    }

    return NextResponse.json({
      status: 'success',
      data: comments
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
})

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const data = await req.json()
    const { parentId, ...commentData } = data

    let comment
    if (parentId) {
      // Create a reply
      comment = await CommentModel.createReply(parentId, commentData)
    } else {
      // Create a new comment
      comment = await CommentModel.create(commentData)
    }

    // Get project ID for Socket.IO emission
    let projectId: string | null = null
    try {
      // Fetch the element with its review and project data
      const elementWithProject = await db.element.select().from(table).where(eq(table.id, id))
      
      if (elementWithProject?.review?.project) {
        projectId = elementWithProject.review.project.id
      }
    } catch (error) {
      console.error('Error fetching project for Socket.IO emission:', error)
    }

    // Emit Socket.IO event for real-time updates
    if (global.io && projectId) {
      if (parentId) {
        // Emit reply event
        global.io.to(`project-${projectId}`).emit('new-reply', {
          elementId: comment.elementId,
          reply: comment
        })
        global.io.to(`element-${comment.elementId}`).emit('new-reply', {
          elementId: comment.elementId,
          reply: comment
        })
        console.log(`Socket.IO: Emitted new-reply for project ${projectId}, element ${comment.elementId}`)
      } else {
        // Emit new comment event
        global.io.to(`project-${projectId}`).emit('new-comment', {
          elementId: comment.elementId,
          comment: comment
        })
        global.io.to(`element-${comment.elementId}`).emit('new-comment', {
          elementId: comment.elementId,
          comment: comment
        })
        console.log(`Socket.IO: Emitted new-comment for project ${projectId}, element ${comment.elementId}`)
      }
    } else {
      console.log('Socket.IO: No global.io or projectId available for emission')
    }

    return NextResponse.json({
      status: 'success',
      message: parentId ? 'Reply added successfully' : 'Comment added successfully',
      data: comment
    })
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
})

export const PUT = withAuth(async (req: NextRequest) => {
  try {
    const { id, ...updateData } = await req.json()

    if (!id) {
      return NextResponse.json({
        status: 'error',
        message: 'Comment ID is required'
      }, { status: 400 })
    }

    const comment = await CommentModel.update(id, updateData)

    // Get project ID for Socket.IO emission
    let projectId: string | null = null
    try {
      const elementWithProject = await db.element.select().from(table).where(eq(table.id, id))
      
      if (elementWithProject?.review?.project) {
        projectId = elementWithProject.review.project.id
      }
    } catch (error) {
      console.error('Error fetching project for Socket.IO emission:', error)
    }

    // Emit Socket.IO event for real-time updates
    if (global.io && projectId) {
      global.io.to(`project-${projectId}`).emit('comment-updated', {
        elementId: comment.elementId,
        comment: comment
      })
      global.io.to(`element-${comment.elementId}`).emit('comment-updated', {
        elementId: comment.elementId,
        comment: comment
      })
      console.log(`Socket.IO: Emitted comment-updated for project ${projectId}, element ${comment.elementId}`)
    }

    return NextResponse.json({
      status: 'success',
      message: 'Comment updated successfully',
      data: comment
    })
  } catch (error) {
    console.error('Update comment error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
})

export const DELETE = withAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        status: 'error',
        message: 'Comment ID is required'
      }, { status: 400 })
    }

    const deletedComment = await CommentModel.delete(id)

    // Get project ID for Socket.IO emission
    let projectId: string | null = null
    try {
      const elementWithProject = await db.element.select().from(table).where(eq(table.id, id))
      
      if (elementWithProject?.review?.project) {
        projectId = elementWithProject.review.project.id
      }
    } catch (error) {
      console.error('Error fetching project for Socket.IO emission:', error)
    }

    // Emit Socket.IO event for real-time updates
    if (global.io && projectId) {
      global.io.to(`project-${projectId}`).emit('comment-deleted', {
        elementId: deletedComment.elementId,
        commentId: id
      })
      global.io.to(`element-${deletedComment.elementId}`).emit('comment-deleted', {
        elementId: deletedComment.elementId,
        commentId: id
      })
      console.log(`Socket.IO: Emitted comment-deleted for project ${projectId}, element ${deletedComment.elementId}`)
    }

    return NextResponse.json({
      status: 'success',
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
})
