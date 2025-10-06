import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// PATCH - Update review status
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('reviewId')
    const { status } = await request.json()

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 })
    }

    if (!status || !['PENDING', 'APPROVED', 'REVISION_REQUESTED'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const updatedReview = await prisma.review.update({
      where: { id: parseInt(reviewId) },
      data: { status },
      include: {
        project: true
      }
    })

    return NextResponse.json(updatedReview)
  } catch (error) {
    console.error('Error updating review status:', error)
    return NextResponse.json({ error: "Failed to update review status" }, { status: 500 })
  }
}
