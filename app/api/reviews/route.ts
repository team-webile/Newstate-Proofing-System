import { NextResponse } from "next/server"
import { createReview, createActivityLog, getReviewsByProjectId } from "@/lib/db"
import { nanoid } from "nanoid"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }
    
    const reviews = await getReviewsByProjectId(parseInt(projectId))
    return NextResponse.json(reviews)
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { projectId } = await request.json()
    const shareLink = nanoid(10)
    const review = await createReview(projectId, shareLink)
    
    // Log activity
    await createActivityLog({
      projectId: projectId,
      userName: "Admin",
      action: "REVIEW_CREATED",
      details: `Created review ${shareLink}`,
    })
    
    console.log("Review created:", review)
    
    // In production, you would emit a socket event here:
    // io.to(`project_${projectId}`).emit('review_created', review)
    
    return NextResponse.json(review)
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}
