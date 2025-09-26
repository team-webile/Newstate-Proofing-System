import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Update annotation as resolved
    const annotation = await prisma.annotation.update({
      where: { id },
      data: {
        isResolved: true,
        updatedAt: new Date(),
      },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Annotation resolved successfully",
      data: annotation,
    });
  } catch (error) {
    console.error("Annotation resolve error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to resolve annotation",
      },
      { status: 500 }
    );
  }
}
