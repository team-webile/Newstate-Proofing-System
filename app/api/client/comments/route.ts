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

// POST - Add new comment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      elementId,
      projectId,
      commentText,
      coordinates,
      userName,
      parentId,
      type = "GENERAL",
    } = body;

    // Validate required fields
    if (!elementId || !projectId || !commentText || !userName) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Verify element exists and belongs to project
    const [element] = await db
      .select()
      .from(elements)
      .leftJoin(reviews, eq(elements.reviewId, reviews.id))
      .where(and(eq(elements.id, elementId), eq(reviews.projectId, projectId)))
      .limit(1);

    if (!element) {
      return NextResponse.json(
        {
          status: "error",
          message: "Element not found or does not belong to project",
        },
        { status: 404 }
      );
    }

    // Create comment
    const [newComment] = await db
      .insert(comments)
      .values({
        elementId,
        commentText,
        coordinates,
        userName,
        parentId,
        type: type as any,
        status: "ACTIVE",
      })
      .returning();

    return NextResponse.json({
      status: "success",
      message: "Comment added successfully",
      data: {
        id: newComment.id,
        elementId: newComment.elementId,
        commentText: newComment.commentText,
        coordinates: newComment.coordinates,
        userName: newComment.userName,
        createdAt: newComment.createdAt,
        type: newComment.type,
        status: newComment.status,
        parentId: newComment.parentId,
      },
    });
  } catch (error) {
    console.error("Comment creation error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to add comment",
      },
      { status: 500 }
    );
  }
}

// GET - Get comments for project/element
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const elementId = searchParams.get("elementId");

    if (!projectId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Project ID is required",
        },
        { status: 400 }
      );
    }

    // Build query with joins
    let query = db
      .select({
        id: comments.id,
        elementId: comments.elementId,
        commentText: comments.commentText,
        coordinates: comments.coordinates,
        userName: comments.userName,
        createdAt: comments.createdAt,
        type: comments.type,
        status: comments.status,
        parentId: comments.parentId,
        element: {
          id: elements.id,
          review: {
            id: reviews.id,
            projectId: reviews.projectId,
            project: {
              id: projects.id,
              title: projects.title,
            },
          },
        },
      })
      .from(comments)
      .leftJoin(elements, eq(comments.elementId, elements.id))
      .leftJoin(reviews, eq(elements.reviewId, reviews.id))
      .leftJoin(projects, eq(reviews.projectId, projects.id))
      .where(eq(reviews.projectId, projectId));

    if (elementId) {
      query = query.where(
        and(eq(reviews.projectId, projectId), eq(comments.elementId, elementId))
      );
    }

    const commentsData = await query.orderBy(desc(comments.createdAt));

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      commentsData.map(async (comment) => {
        const replies = await db
          .select()
          .from(comments)
          .where(eq(comments.parentId, comment.id))
          .orderBy(asc(comments.createdAt));

        return {
          id: comment.id,
          elementId: comment.elementId,
          commentText: comment.commentText,
          coordinates: comment.coordinates,
          userName: comment.userName,
          createdAt: comment.createdAt,
          type: comment.type,
          status: comment.status,
          parentId: comment.parentId,
          replies: replies.map((reply) => ({
            id: reply.id,
            commentText: reply.commentText,
            userName: reply.userName,
            createdAt: reply.createdAt,
            type: reply.type,
            status: reply.status,
          })),
        };
      })
    );

    return NextResponse.json({
      status: "success",
      message: "Comments retrieved successfully",
      data: commentsWithReplies,
    });
  } catch (error) {
    console.error("Comment fetch error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch comments",
      },
      { status: 500 }
    );
  }
}
