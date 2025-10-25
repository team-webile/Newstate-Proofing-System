import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createApproval, createActivityLog } from '@/lib/db'
import { sendProjectApprovalNotificationToAdmin } from '@/lib/email'

export const dynamic = 'force-dynamic'

// PATCH - Update review status
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('reviewId')
    const { status, clientName, clientEmail } = await request.json()

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 })
    }

    if (!status || !['PENDING', 'APPROVED', 'REVISION_REQUESTED'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // If approving and client name is provided, create approval record
    if (status === 'APPROVED' && clientName) {
      // Create approval record with client name
      await createApproval({
        reviewId: parseInt(reviewId),
        firstName: clientName.split(' ')[0] || clientName,
        lastName: clientName.split(' ').slice(1).join(' ') || '',
        decision: 'APPROVED',
        notes: `Approved by ${clientName}`
      })
    }

    const updatedReview = await prisma.review.update({
      where: { id: parseInt(reviewId) },
      data: { status },
      include: {
        project: true
      }
    })

    // Log activity
    await createActivityLog({
      projectId: updatedReview.projectId,
      userName: clientName || 'Client',
      action: status === 'APPROVED' ? 'REVIEW_APPROVED' : 'REVIEW_STATUS_UPDATED',
      details: `Review status updated to ${status}${clientName ? ` by ${clientName}` : ''}`,
    })

    // Send approval email notification to admin if project was approved
    if (status === 'APPROVED' && clientName) {
      try {
        const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://preview.devnstage.xyz'}/admin/review/${updatedReview.shareLink}`
        const approvedAt = new Date().toLocaleString()
        
        const emailResult = await sendProjectApprovalNotificationToAdmin({
          clientName: clientName,
          clientEmail: clientEmail,
          projectName: updatedReview.project.name,
          projectNumber: updatedReview.project.projectNumber,
          reviewLink: reviewLink,
          approvedAt: approvedAt
        })

        if (emailResult.success) {
          console.log(`✅ Approval email sent to admin for project ${updatedReview.project.name}`)
        } else {
          console.error('❌ Failed to send approval email to admin')
        }
      } catch (error) {
        console.error('❌ Error sending approval email:', error)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(updatedReview)
  } catch (error) {
    console.error('Error updating review status:', error)
    return NextResponse.json({ error: "Failed to update review status" }, { status: 500 })
  }
}
