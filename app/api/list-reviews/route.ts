import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const reviews = await db.review.findMany({
      select: {
        id: true,
        reviewName: true,
        description: true,
        status: true,
        projectId: true,
        shareLink: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            title: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Reviews listed successfully',
      data: {
        count: reviews.length,
        reviews: reviews
      }
    })
  } catch (error) {
    console.error('List reviews error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to list reviews',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
