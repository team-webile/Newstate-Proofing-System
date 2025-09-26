import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Fetch comments from database
    const comments = await prisma.comment.findMany({
      where: {
        ...(elementId && { elementId: elementId }),
        element: {
          review: {
            projectId: projectId
          }
        }
      },
      include: {
        replies: true,
        element: {
          include: {
            review: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Comments fetched successfully',
      data: comments
    })

  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch comments'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { elementId, projectId, commentText, coordinates, userName, parentId, type } = body

    if (!elementId || !commentText || !userName) {
      return NextResponse.json({
        status: 'error',
        message: 'Element ID, comment text, and user name are required'
      }, { status: 400 })
    }

    // Save comment to database
    const comment = await prisma.comment.create({
      data: {
        elementId: elementId,
        commentText,
        coordinates: coordinates || '',
        userName,
        parentId: parentId || null,
        type: type || 'GENERAL',
        status: 'ACTIVE'
      },
      include: {
        replies: true,
        element: {
          include: {
            review: true
          }
        }
      }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Comment added successfully',
      data: comment
    })

  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to add comment'
    }, { status: 500 })
  }
}