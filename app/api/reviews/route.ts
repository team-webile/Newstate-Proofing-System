import { NextRequest, NextResponse } from 'next/server'
import { ReviewModel, CreateReviewData } from '@/models/Review'
import { withAuth, AuthUser } from '@/lib/auth'

async function handler(req: NextRequest, user: AuthUser) {
  try {
    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')

      let reviews
      if (projectId) {
        reviews = await ReviewModel.findByProjectId(projectId)
      } else {
        reviews = await ReviewModel.findAll()
      }

      return NextResponse.json({
        status: 'success',
        message: 'Reviews retrieved successfully',
        data: reviews
      })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { name, description, projectId } = body

      // Validate required fields
      if (!name || !projectId) {
        return NextResponse.json({
          status: 'error',
          message: 'Name and project ID are required'
        }, { status: 400 })
      }

      const reviewData: CreateReviewData = {
        name,
        description,
        projectId
      }

      const review = await ReviewModel.create(reviewData)

      return NextResponse.json({
        status: 'success',
        message: 'Review created successfully',
        data: review
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Method not allowed'
    }, { status: 405 })
  } catch (error) {
    console.error('Review API error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}

// GET handler without authentication
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    let reviews
    if (projectId) {
      reviews = await ReviewModel.findByProjectId(projectId)
    } else {
      reviews = await ReviewModel.findAll()
    }

    return NextResponse.json({
      status: 'success',
      message: 'Reviews retrieved successfully',
      data: reviews
    })
  } catch (error) {
    console.error('Review API error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}

// POST handler without authentication for creating reviews
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, projectId } = body

    // Validate required fields
    if (!name || !projectId) {
      return NextResponse.json({
        status: 'error',
        message: 'Name and project ID are required'
      }, { status: 400 })
    }

    const reviewData: CreateReviewData = {
      reviewName: name,
      description,
      projectId,
      shareLink: `review-${projectId}`,
      updatedAt: new Date()
    }

    const review = await ReviewModel.create(reviewData)

    return NextResponse.json({
      status: 'success',
      message: 'Review created successfully',
      data: review
    })
  } catch (error) {
    console.error('Review API error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}
