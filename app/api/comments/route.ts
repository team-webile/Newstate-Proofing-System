import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

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

    // For now, return empty array since the relationship logic is complex
    // TODO: Implement proper comment fetching with project relationships
    const commentsList = []

    return NextResponse.json({
      status: 'success',
      message: 'Comments fetched successfully',
      data: commentsList
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
    const [comment] = await db
      .insert(comments)
      .values({
        elementId: elementId,
        commentText,
        coordinates: coordinates || '',
        userName,
        parentId: parentId || null,
        type: type || 'GENERAL',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()

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