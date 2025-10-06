import { NextRequest, NextResponse } from 'next/server'
import { getReviewByShareLink } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { shareLink: string } }
) {
  try {
    const { shareLink } = params

    if (!shareLink) {
      return NextResponse.json({ error: "Share link is required" }, { status: 400 })
    }

    const review = await getReviewByShareLink(shareLink)

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error fetching review by share link:', error)
    return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 })
  }
}
