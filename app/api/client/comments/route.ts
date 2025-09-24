import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const elementId = searchParams.get('elementId')

    if (!projectId && !elementId) {
      return NextResponse.json({
        status: 'error',
        message: 'Project ID or Element ID is required'
      }, { status: 400 })
    }

    let comments
    if (elementId) {
      // Fetch comments for specific element
      comments = await prisma.comment.findMany({
        where: { elementId },
        orderBy: { createdAt: 'asc' }
      })
    } else if (projectId) {
      // Fetch comments for entire project
      comments = await prisma.comment.findMany({
        where: {
          element: {
            review: {
              projectId
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      })
    }

    return NextResponse.json({
      status: 'success',
      data: comments || []
    })
  } catch (error) {
    console.error('Client fetch comments error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    // Handle both 'content' and 'commentText' field names
    const commentText = data.commentText || data.content
    const elementId = data.elementId
    const type = data.type || 'GENERAL'
    const coordinates = data.coordinates
    const parentId = data.parentId

    if (!commentText || !elementId) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Comment text and element ID are required' 
      }, { status: 400 })
    }

    // Create comment in database using Prisma directly
    const comment = await prisma.comment.create({
      data: {
        elementId,
        commentText,
        type,
        coordinates,
        parentId,
        userName: data.userName || 'Client'
      },
      include: {
        element: {
          include: {
            review: {
              include: {
                project: true
              }
            }
          }
        }
      }
    })

    // Update element status if it's a rejection request
    if (type === 'APPROVAL_REQUEST') {
      await prisma.element.update({
        where: { id: elementId },
        data: { status: 'REJECTED' }
      })
    }

    // Get project ID for Socket.IO emission
    let projectId: string | null = null
    try {
      // Fetch the element with its review and project data
      const elementWithProject = await prisma.element.findUnique({
        where: { id: comment.elementId },
        include: {
          review: {
            include: {
              project: true
            }
          }
        }
      })
      
      if (elementWithProject?.review?.project) {
        projectId = elementWithProject.review.project.id
      }
    } catch (error) {
      console.error('Error fetching project for Socket.IO emission:', error)
    }

    // Emit Socket.IO event for real-time updates
    if (global.io && projectId) {
      if (parentId) {
        // This is a reply to an existing comment
        global.io.to(`project-${projectId}`).emit('new-reply', {
          elementId: comment.elementId,
          parentId: parentId,
          comment: comment
        })
        global.io.to(`element-${comment.elementId}`).emit('new-reply', {
          elementId: comment.elementId,
          parentId: parentId,
          comment: comment
        })
        console.log(`Socket.IO: Emitted new-reply for project ${projectId}, element ${comment.elementId}, parent ${parentId}`)
      } else {
        // This is a new comment/annotation
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
      
      // Also emit element status change if it was a rejection
      if (type === 'APPROVAL_REQUEST') {
        global.io.to(`project-${projectId}`).emit('element-status-changed', {
          elementId: comment.elementId,
          status: 'REJECTED',
          comment: comment
        })
        global.io.to(`element-${comment.elementId}`).emit('element-status-changed', {
          elementId: comment.elementId,
          status: 'REJECTED',
          comment: comment
        })
        console.log(`Socket.IO: Emitted element-status-changed for project ${projectId}, element ${comment.elementId}`)
      }
    } else {
      console.log('Socket.IO: No global.io or projectId available for emission')
    }

    return NextResponse.json({
      status: 'success',
      message: 'Comment submitted successfully',
      data: comment
    })
  } catch (error) {
    console.error('Client comment API error:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, commentText } = data

    if (!id || !commentText) {
      return NextResponse.json({
        status: 'error',
        message: 'Comment ID and text are required'
      }, { status: 400 })
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { commentText },
      include: {
        element: {
          include: {
            review: {
              include: {
                project: true
              }
            }
          }
        }
      }
    })

    // Get project ID for Socket.IO emission
    let projectId: string | null = null
    try {
      if (comment.element?.review?.project) {
        projectId = comment.element.review.project.id
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
    console.error('Client comment update error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        status: 'error',
        message: 'Comment ID is required'
      }, { status: 400 })
    }

    const deletedComment = await prisma.comment.delete({
      where: { id },
      include: {
        element: {
          include: {
            review: {
              include: {
                project: true
              }
            }
          }
        }
      }
    })

    // Get project ID for Socket.IO emission
    let projectId: string | null = null
    try {
      if (deletedComment.element?.review?.project) {
        projectId = deletedComment.element.review.project.id
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
    console.error('Client comment delete error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}
