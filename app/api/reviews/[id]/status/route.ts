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
    const [review] = await db
      .update(reviews)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id))
      .returning();

    // Emit socket event for real-time updates
    try {
      const { getSocketServer } = await import('@/lib/socket-server');
      const io = getSocketServer();
      
      if (io) {
        // Better detection of admin vs client
        const referer = req.headers.get('referer') || '';
        const userAgent = req.headers.get('user-agent') || '';
        const isFromAdmin = referer.includes('/admin/') || userAgent.includes('admin') || req.url.includes('/admin/');
        
        console.log('🔍 Status update detection:', { referer, userAgent, isFromAdmin, url: req.url });
        
        // Create status update message
        const statusMessage = `📊 Review status updated to: ${status}`;
        
        // Emit to all clients in project room
        io.to(`project-${review.projectId}`).emit('reviewStatusUpdated', {
          reviewId: review.id,
          projectId: review.projectId,
          status: status,
          updatedAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          message: statusMessage,
          isFromAdmin: isFromAdmin
        });
        
        // Send dummy success message to opposite user type
        if (isFromAdmin) {
          // Admin updated status, send success message to client
          io.to(`project-${review.projectId}`).emit('dummySuccessMessage', {
            type: 'status_updated',
            message: `✅ Review status updated to ${status} by Admin`,
            from: 'Admin',
            to: 'Client',
            projectId: review.projectId,
            timestamp: new Date().toISOString()
          });
        } else {
          // Client updated status, send success message to admin
          io.to(`project-${review.projectId}`).emit('dummySuccessMessage', {
            type: 'status_updated',
            message: `✅ Client updated review status to ${status}`,
            from: 'Client',
            to: 'Admin',
            projectId: review.projectId,
            timestamp: new Date().toISOString()
          });
        }
        
        console.log(`📡 Emitted reviewStatusUpdated for review ${review.id} in project ${review.projectId}`);
      } else {
        console.log("⚠️ Socket server not available for review status update");
      }
    } catch (error) {
      console.log("Socket emission error:", error);
    }

    // Determine if this is from admin or client for response message
    const referer = req.headers.get('referer') || '';
    const userAgent = req.headers.get('user-agent') || '';
    const isFromAdmin = referer.includes('/admin/') || userAgent.includes('admin') || req.url.includes('/admin/');
    
    const successMessage = isFromAdmin 
      ? `✅ Admin updated review status to ${status}! Client will be notified.`
      : `✅ Client updated review status to ${status}! Admin will be notified.`;

    return NextResponse.json({
      status: "success",
      message: successMessage,
      data: review,
      dummyMessage: successMessage,
      isFromAdmin: isFromAdmin
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
