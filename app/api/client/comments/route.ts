import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

// POST - Add new comment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      elementId, 
      projectId, 
      commentText, 
      coordinates, 
      userName, 
      parentId, 
      type = 'GENERAL' 
    } = body

    // Validate required fields
    if (!elementId || !projectId || !commentText || !userName) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing required fields'
      }, { status: 400 })
    }

    // Verify element exists and belongs to project
    const element = await db.element.findFirst({
      where: {
        id: elementId,
        review: {
          projectId: projectId
        }
      }
    })

    if (!element) {
      return NextResponse.json({
        status: 'error',
        message: 'Element not found or does not belong to project'
      }, { status: 404 })
    }

    // Create comment
    const comment = await db.comment.create({
      data: {
        elementId,
        commentText,
        coordinates,
        userName,
        parentId,
        type: type as any,
        status: 'ACTIVE'
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

    return NextResponse.json({
      status: 'success',
      message: 'Comment added successfully',
      data: {
        id: comment.id,
        elementId: comment.elementId,
        commentText: comment.commentText,
        coordinates: comment.coordinates,
        userName: comment.userName,
        createdAt: comment.createdAt,
        type: comment.type,
        status: comment.status,
        parentId: comment.parentId
      }
    })

  } catch (error) {
    console.error('Comment creation error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to add comment'
    }, { status: 500 })
  }
}

// GET - Get comments for project/element
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const elementId = searchParams.get('elementId')

    if (!projectId) {
      return NextResponse.json({
        status: 'error',
        message: 'Project ID is required'
      }, { status: 400 })
    }

    // Build where clause
    const where: any = {
      element: {
        review: {
          projectId: projectId
        }
      }
    }

    if (elementId) {
      where.elementId = elementId
    }

    const comments = await db.comment.findMany({
      where,
      include: {
        element: {
          include: {
            review: {
              include: {
                project: true
              }
            }
          }
        },
        replies: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Comments retrieved successfully',
      data: comments.map(comment => ({
        id: comment.id,
        elementId: comment.elementId,
        commentText: comment.commentText,
        coordinates: comment.coordinates,
        userName: comment.userName,
        createdAt: comment.createdAt,
        type: comment.type,
        status: comment.status,
        parentId: comment.parentId,
        replies: comment.replies.map(reply => ({
          id: reply.id,
          commentText: reply.commentText,
          userName: reply.userName,
          createdAt: reply.createdAt,
          type: reply.type,
          status: reply.status
        }))
      }))
    })

  } catch (error) {
    console.error('Comment fetch error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch comments'
    }, { status: 500 })
  }
}