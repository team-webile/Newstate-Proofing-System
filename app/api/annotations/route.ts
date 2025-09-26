import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Add new annotation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, fileId, projectId, coordinates, addedBy, addedByName } =
      body;

    // Validate required fields
    if (!content || !fileId || !projectId || !addedBy) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Verify project exists and check review status
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        reviews: {
          where: { status: { in: ["APPROVED", "REJECTED"] } },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          status: "error",
          message: "Project not found",
        },
        { status: 404 }
      );
    }

    // Check if review is approved or rejected
    if (project.reviews.length > 0) {
      const latestReview = project.reviews[0];
      if (
        latestReview.status === "APPROVED" ||
        latestReview.status === "REJECTED"
      ) {
        return NextResponse.json(
          {
            status: "error",
            message: `Annotations are disabled. Review status is ${latestReview.status}`,
          },
          { status: 403 }
        );
      }
    }

    // Create annotation in database
    const annotation = await prisma.annotation.create({
      data: {
        content,
        fileId,
        projectId,
        coordinates: coordinates ? JSON.stringify(coordinates) : null,
        addedBy,
        addedByName,
      },
    });

    // Emit socket event for real-time updates
    try {
      // Note: Socket emission would happen here in a real implementation
      console.log(
        `Annotation created: ${annotation.id} for project ${projectId}`
      );
    } catch (error) {
      console.log("Socket emission skipped:", error);
    }

    return NextResponse.json({
      status: "success",
      message: "Annotation added successfully",
      data: annotation,
    });
  } catch (error) {
    console.error("Annotation creation error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to add annotation",
      },
      { status: 500 }
    );
  }
}

// GET - Get annotations for project/file
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const fileId = searchParams.get("fileId");

    if (!projectId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Project ID is required",
        },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      projectId: projectId,
    };

    if (fileId) {
      where.fileId = fileId;
    }

    const annotations = await prisma.annotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Parse coordinates for each annotation
    const annotationsWithCoordinates = annotations.map((annotation: any) => ({
      ...annotation,
      x: annotation.coordinates
        ? JSON.parse(annotation.coordinates).x
        : undefined,
      y: annotation.coordinates
        ? JSON.parse(annotation.coordinates).y
        : undefined,
    }));

    return NextResponse.json({
      status: "success",
      message: "Annotations retrieved successfully",
      data: annotationsWithCoordinates,
    });
  } catch (error) {
    console.error("Annotation fetch error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch annotations",
      },
      { status: 500 }
    );
  }
}
