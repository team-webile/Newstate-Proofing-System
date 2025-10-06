import { NextResponse } from "next/server"
import { createApproval, createActivityLog, prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const approval = await createApproval(data)
    
    // Get the review to find the project ID for logging
    const review = await prisma.review.findUnique({
      where: { id: data.reviewId },
      include: { project: true },
    })
    
    if (review) {
      // Log activity
      await createActivityLog({
        projectId: review.projectId,
        userName: `${data.firstName} ${data.lastName}`,
        action: "REVIEW_APPROVED",
        details: `${data.decision === "approved" ? "Approved" : "Requested revisions for"} review ${review.shareLink}`,
      })
    }
    
    console.log("Approval created:", approval)
    
    // In production, you would emit a socket event here:
    // io.to(`project_${review.project_id}`).emit('approval_received', approval)
    // io.to(`review_${data.reviewId}`).emit('status_updated', { status: approval.decision })
    
    return NextResponse.json(approval)
  } catch (error) {
    console.error("Error creating approval:", error)
    return NextResponse.json({ error: "Failed to create approval" }, { status: 500 })
  }
}
