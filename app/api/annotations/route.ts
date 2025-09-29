import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings, annotations, annotationReplies } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm';

// POST - Add new annotation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Annotations POST - Request body:', body);
    const { content, fileId, projectId, coordinates, addedBy, addedByName } =
      body;

    // Validate required fields
    if (!content || !fileId || !projectId || !addedBy) {
      console.log('Annotations POST - Missing required fields:', { content, fileId, projectId, addedBy });
      return NextResponse.json(
        {
          status: "error",
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Verify project exists
    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title
      })
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      return NextResponse.json(
        {
          status: "error",
          message: "Project not found",
        },
        { status: 404 }
      );
    }

    // For now, skip review status check since it's complex
    // TODO: Implement proper review status checking

    // Create annotation in database
    console.log('Annotations POST - Creating annotation with data:', {
      content,
      fileId,
      projectId,
      coordinates: coordinates ? JSON.stringify(coordinates) : null,
      addedBy,
      addedByName
    });
    
    const [annotation] = await db.insert(annotations).values({
      content,
      fileId,
      projectId,
      coordinates: coordinates ? JSON.stringify(coordinates) : null,
      addedBy,
      addedByName,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log('Annotations POST - Annotation created:', annotation);

    // Create a dummy message for the annotation conversation
    try {
      const { annotationReplies } = await import('@/db/schema');
      
      console.log('📝 Creating dummy message for annotation:', annotation.id);
      
      // Add dummy message: "No replies yet. Be the first to respond!"
      const [dummyReply] = await db.insert(annotationReplies).values({
        annotationId: annotation.id,
        projectId: annotation.projectId,
        content: "No replies yet. Be the first to respond!",
        addedBy: "system",
        addedByName: "System",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      console.log('📝 Created dummy message for annotation:', dummyReply);
      console.log('📝 Dummy message ID:', dummyReply?.id);
      console.log('📝 Dummy message content:', dummyReply?.content);
    } catch (error) {
      console.log("❌ Error creating dummy message:", error);
      console.log("❌ Error details:", error instanceof Error ? error.message : 'Unknown error');
    }

    // Emit socket event for real-time updates
    try {
      const { getSocketServer } = await import('@/lib/socket-server');
      const io = getSocketServer();
      
      if (io) {
        console.log('📡 Emitting annotationAdded event for project:', projectId);
        
        // Determine if this is from admin or client
        const isFromAdmin = addedBy === 'Admin' || addedByName?.includes('Admin');
        
        // Create dummy success message based on who added the annotation
        const dummyMessage = isFromAdmin 
          ? `✅ Admin added annotation: "${annotation.content}"`
          : `✅ Client added annotation: "${annotation.content}"`;
        
        io.to(`project-${projectId}`).emit('annotationAdded', {
          id: annotation.id,
          content: annotation.content,
          fileId: annotation.fileId,
          projectId: annotation.projectId,
          coordinates: annotation.coordinates,
          addedBy: annotation.addedBy,
          addedByName: annotation.addedByName,
          isResolved: annotation.isResolved,
          status: annotation.status,
          createdAt: annotation.createdAt,
          timestamp: new Date().toISOString(),
          // Include dummy message in the annotation data
          hasDummyMessage: true,
          dummyMessage: dummyMessage,
          isFromAdmin: isFromAdmin
        });
        
        // Send dummy success message to opposite user type
        if (isFromAdmin) {
          // Admin added annotation, send success message to client
          io.to(`project-${projectId}`).emit('dummySuccessMessage', {
            type: 'annotation_added',
            message: `✅ Your annotation has been added successfully!`,
            from: 'Admin',
            to: 'Client',
            timestamp: new Date().toISOString()
          });
        } else {
          // Client added annotation, send success message to admin
          io.to(`project-${projectId}`).emit('dummySuccessMessage', {
            type: 'annotation_added',
            message: `✅ Client annotation received and saved!`,
            from: 'Client',
            to: 'Admin',
            timestamp: new Date().toISOString()
          });
        }
        
        console.log('✅ Socket event emitted successfully');
      } else {
        console.log('⚠️ Socket server not available');
      }
    } catch (error) {
      console.log("Socket emission error:", error);
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

    const annotationsList = await db
      .select()
      .from(annotations)
      .where(eq(annotations.projectId, projectId))
      .orderBy(desc(annotations.createdAt));

    // Fetch replies for each annotation
    const annotationsWithReplies = await Promise.all(
      annotationsList.map(async (annotation: any) => {
        // Fetch replies for this annotation
        const replies = await db
          .select()
          .from(annotationReplies)
          .where(eq(annotationReplies.annotationId, annotation.id))
          .orderBy(asc(annotationReplies.createdAt));

        return {
          ...annotation,
          x: annotation.coordinates
            ? JSON.parse(annotation.coordinates).x
            : undefined,
          y: annotation.coordinates
            ? JSON.parse(annotation.coordinates).y
            : undefined,
          replies: replies
        };
      })
    );

    console.log('📝 Fetched annotations with replies:', annotationsWithReplies.length);
    console.log('📝 Sample annotation with replies:', annotationsWithReplies[0]);

    return NextResponse.json({
      status: "success",
      message: "Annotations retrieved successfully",
      data: annotationsWithReplies,
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
