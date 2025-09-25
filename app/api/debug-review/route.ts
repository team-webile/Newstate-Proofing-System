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

    // Check if review exists
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

    if (!review) {
      return NextResponse.json({
        status: 'error',
        message: 'Review not found',
        debug: {
          reviewId,
          allReviews: await prisma.review.findMany({
            select: { id: true, reviewName: true, projectId: true }
          })
        }
      }, { status: 404 })
    }

    return NextResponse.json({
      status: 'success',
      data: review
    })
  } catch (error) {
    console.error('Debug review error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
