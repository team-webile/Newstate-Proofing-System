import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reviewId = searchParams.get('id')
    
    if (!reviewId) {
      return NextResponse.json({
        status: 'error',
        message: 'Review ID is required'
      }, { status: 400 })
    }

    console.log('Testing review fix for ID:', reviewId)

    // First, try to get the review directly
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        project: true,
        elements: {
          include: {
            versions: true,
            comments: true,
            approvals: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (review) {
      return NextResponse.json({
        status: 'success',
        message: 'Review found directly',
        data: review
      })
    }

    // If not found, check if it's a project ID
    const project = await prisma.project.findUnique({
      where: { id: reviewId },
      include: {
        client: true,
        user: true
      }
    })

    if (project) {
      // Check if review already exists for this project
      const existingReview = await prisma.review.findFirst({
        where: { projectId: project.id }
      })

      if (existingReview) {
        return NextResponse.json({
          status: 'success',
          message: 'Review found for project',
          data: existingReview
        })
      }

      return NextResponse.json({
        status: 'info',
        message: 'Project found but no review exists yet',
        data: {
          project: project,
          suggestion: 'Use POST /api/create-review-for-project to create a review'
        }
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Neither review nor project found',
      debug: {
        requestedId: reviewId,
        suggestion: 'Check if the ID is correct'
      }
    })
  } catch (error) {
    console.error('Test review fix error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
