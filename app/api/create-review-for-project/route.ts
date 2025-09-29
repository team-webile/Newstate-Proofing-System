import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { projectId, reviewName, description } = await req.json()

    if (!projectId) {
      return NextResponse.json({
        status: 'error',
        message: 'Project ID is required'
      }, { status: 400 })
    }

    // Check if project exists
    const project = await db.project.select().from(table).where(eq(table.id, id))

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    // Check if review already exists for this project
    const existingReview = await db.review.findFirst({
      where: { projectId: projectId }
    })

    if (existingReview) {
      return NextResponse.json({
        status: 'success',
        message: 'Review already exists for this project',
        data: existingReview
      })
    }

    // Create new review with unique shareLink
    const uniqueShareLink = `review-${project.id}-${Date.now()}`
    const review = await ReviewModel.create({
      reviewName: reviewName || `Review for ${project.title}`,
      description: description || `Review for project: ${project.title}`,
      projectId: project.id,
      shareLink: uniqueShareLink,
      updatedAt: new Date()
    })

    // Get the review with all related data
    const reviewWithElements = await ReviewModel.findWithElements(review.id)

    return NextResponse.json({
      status: 'success',
      message: 'Review created successfully',
      data: reviewWithElements
    })
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create review',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
