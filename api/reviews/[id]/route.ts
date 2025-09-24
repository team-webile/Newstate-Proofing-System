import { NextRequest, NextResponse } from 'next/server'
import { ReviewModel, UpdateReviewData } from '@/models/Review'
import { withAuth, AuthUser } from '@/lib/auth'

async function handler(
  req: NextRequest, 
  user: AuthUser
) {
  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]

    if (req.method === 'GET') {
      const review = await ReviewModel.findWithElements(id)
      
      if (!review) {
        return NextResponse.json({
          status: 'error',
          message: 'Review not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        status: 'success',
        message: 'Review retrieved successfully',
        data: review
      })
    }

    if (req.method === 'PUT') {
      const body = await req.json()
      const { name, description, status } = body

      const updateData: UpdateReviewData = {
        name,
        description,
        status
      }

      const review = await ReviewModel.update(id, updateData)

      return NextResponse.json({
        status: 'success',
        message: 'Review updated successfully',
        data: review
      })
    }

    if (req.method === 'DELETE') {
      await ReviewModel.delete(id)

      return NextResponse.json({
        status: 'success',
        message: 'Review deleted successfully'
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

export const GET = withAuth(handler)
export const PUT = withAuth(handler)
export const DELETE = withAuth(handler)
