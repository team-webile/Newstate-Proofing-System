import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { annotationId, content, addedBy, addedByName } =
      await request.json();

    console.log("Creating annotation reply:", {
      annotationId,
      content,
      addedBy,
      addedByName,
    });

    if (!annotationId || !content || !addedBy) {
      return NextResponse.json(
        { status: "error", message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify annotation exists and check review status
    const annotation = await prisma.annotation.findUnique({
      where: { id: annotationId },
      include: {
        project: {
          include: {
            reviews: {
              where: { status: { in: ["APPROVED", "REJECTED"] } },
              orderBy: { updatedAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!annotation) {
      return NextResponse.json(
        { status: "error", message: "Annotation not found" },
        { status: 404 }
      );
    }

    // Check if review is approved or rejected
    if (annotation.project.reviews.length > 0) {
      const latestReview = annotation.project.reviews[0];
      if (
        latestReview.status === "APPROVED" ||
        latestReview.status === "REJECTED"
      ) {
        return NextResponse.json(
          {
            status: "error",
            message: `Replies are disabled. Review status is ${latestReview.status}`,
          },
          { status: 403 }
        );
      }
    }

    // Create the reply in database
    const reply = await prisma.annotationReply.create({
      data: {
        annotationId,
        content,
        addedBy,
        addedByName: addedByName || addedBy,
      },
    });

    console.log("Reply created successfully:", reply);

    // Emit socket event for real-time updates
    try {
      // Note: Socket emission would happen here in a real implementation
      console.log(
        `Annotation reply created: ${reply.id} for annotation ${annotationId}`
      );
    } catch (error) {
      console.log("Socket emission skipped:", error);
    }

    return NextResponse.json({
      status: "success",
      data: reply,
    });
  } catch (error) {
    console.error("Error creating annotation reply:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to create reply" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
