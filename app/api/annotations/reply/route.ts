import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings, annotations, annotationReplies } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm';

// GET - Get replies for an annotation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const annotationId = searchParams.get('annotationId');

    if (!annotationId) {
      return NextResponse.json(
        { status: "error", message: "Annotation ID is required" },
        { status: 400 }
      );
    }

    const replies = await db
      .select()
      .from(annotationReplies)
      .where(eq(annotationReplies.annotationId, annotationId))
      .orderBy(asc(annotationReplies.createdAt));

    console.log('📝 Fetching replies for annotation:', annotationId);
    console.log('📝 Found replies:', replies.length);
    console.log('📝 Replies data:', replies);

    return NextResponse.json({
      status: "success",
      data: replies,
    });
  } catch (error) {
    console.error("Error fetching annotation replies:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch replies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== REPLY ROUTE CALLED ===");
    console.log("Request URL:", request.url);
    console.log("Request method:", request.method);
    
    const body = await request.json();
    console.log("Request body:", body);
    
    const { annotationId, content, addedBy, addedByName } = body;

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

    // Verify annotation exists
    const [annotation] = await db
      .select()
      .from(annotations)
      .where(eq(annotations.id, annotationId));

    if (!annotation) {
      return NextResponse.json(
        { status: "error", message: "Annotation not found" },
        { status: 404 }
      );
    }

    // Create the reply in database
    const [reply] = await db.insert(annotationReplies).values({
      annotationId,
      projectId: annotation.projectId,
      content,
      addedBy,
      addedByName: addedByName || addedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log("Reply created successfully:", reply);

    // Emit socket event for real-time updates
    try {
      const { getSocketServer } = await import('@/lib/socket-server');
      const io = getSocketServer();
      
      if (io) {
        console.log('📡 Emitting annotationReplyAdded event for project:', annotation.projectId);
        io.to(`project-${annotation.projectId}`).emit('annotationReplyAdded', {
          projectId: annotation.projectId,
          annotationId: annotationId,
          reply: {
            id: reply.id,
            content: reply.content,
            addedBy: reply.addedBy,
            addedByName: reply.addedByName,
            createdAt: reply.createdAt
          },
          timestamp: new Date().toISOString()
        });
        console.log('✅ Socket event emitted successfully');
      } else {
        console.log('⚠️ Socket server not available');
      }
    } catch (error) {
      console.log("Socket emission error:", error);
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
  }
}
