import { NextResponse } from "next/server"
import { createActivityLog, prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function PUT(request: Request) {
  try {
    const { reviewId, projectId, status, userName } = await request.json()
    
    // Update the review status in database
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { status: status as 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED' },
    })
    
    console.log("Status updated:", { reviewId, status })
    
    // Log activity
    if (projectId) {
      await createActivityLog({
        projectId: projectId,
        userName: userName || "Client",
        action: "STATUS_UPDATED",
        details: `Changed status to ${status}`,
      })
    }
    
    // In production, you would emit socket event for real-time updates:
    // io.to(`project_${projectId}`).emit('status_updated', { reviewId, status })
    // io.to(`review_${reviewId}`).emit('status_changed', { status })
    
    return NextResponse.json({ success: true, status, review: updatedReview })
  } catch (error) {
    console.error("Error updating status:", error)
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}

