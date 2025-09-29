import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Update annotation as resolved
    const [annotation] = await db
      .update(annotations)
      .set({
        isResolved: true,
        updatedAt: new Date(),
      })
      .where(eq(annotations.id, id))
      .returning();

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
