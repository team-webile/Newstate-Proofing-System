import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const review = await prisma.review.create({
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
