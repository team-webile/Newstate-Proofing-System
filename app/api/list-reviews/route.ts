import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  projects,
  clients,
  users,
  reviews,
  elements,
  comments,
  approvals,
  settings,
} from "@/db/schema";
import { eq, and, or, like, desc, asc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const reviewsData = await db
      .select({
        id: reviews.id,
        reviewName: reviews.reviewName,
        description: reviews.description,
        status: reviews.status,
        projectId: reviews.projectId,
        shareLink: reviews.shareLink,
        createdAt: reviews.createdAt,
        project: {
          id: projects.id,
          title: projects.title,
          client: {
            id: clients.id,
            firstName: clients.firstName,
            lastName: clients.lastName,
          },
        },
      })
      .from(reviews)
      .leftJoin(projects, eq(reviews.projectId, projects.id))
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .orderBy(desc(reviews.createdAt));

    return NextResponse.json({
      status: "success",
      message: "Reviews listed successfully",
      data: {
        count: reviewsData.length,
        reviews: reviewsData,
      },
    });
  } catch (error) {
    console.error("List reviews error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to list reviews",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
