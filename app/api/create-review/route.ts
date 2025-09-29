import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json({
        status: 'error',
        message: 'Project ID is required'
      }, { status: 400 })
    }

    // Create a review for the project
    const review = await db.review.create({
      data: {
        reviewName: 'Test Review',
        description: 'Test review for project',
        status: 'IN_PROGRESS',
        projectId: projectId,
        shareLink: `review-${projectId}`,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      status: 'success',
      data: review
    })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create review',
      error: error.message
    }, { status: 500 })
  }
}
