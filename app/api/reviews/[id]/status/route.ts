import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status } = await req.json();

    if (!status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid status. Must be PENDING, APPROVED, or REJECTED",
        },
        { status: 400 }
      );
    }

    // Update review status
    const review = await prisma.review.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        project: true,
      },
    });

    // Emit socket event for real-time updates
    try {
      // Note: Socket emission would happen here in a real implementation
      console.log(
        `Review status updated: ${review.id} to ${status} for project ${review.projectId}`
      );
    } catch (error) {
      console.log("Socket emission skipped:", error);
    }

    return NextResponse.json({
      status: "success",
      message: "Review status updated successfully",
      data: review,
    });
  } catch (error) {
    console.error("Review status update error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to update review status",
      },
      { status: 500 }
    );
  }
}
