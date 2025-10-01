import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

// POST - Approve or reject project/file
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { 
      action, // 'approve' or 'reject'
      fileId, // optional - for file-specific approval
      comment,
      approvedBy,
      approvedByName
    } = await req.json()

    if (!action) {
      return NextResponse.json({
        status: 'error',
        message: 'Action is required'
      }, { status: 400 })
    }

    // Use approvedBy or fallback to approvedByName or 'Admin'
    const approverId = approvedBy || approvedByName || 'Admin'

    // Verify project exists
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId))

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    // Create approval record
    const [approval] = await db.insert(approvals).values({
      type: fileId ? 'ELEMENT' : 'PROJECT',
      projectId: projectId,
      elementId: fileId,
      userName: approvedByName || 'Admin User',
      signature: `${approvedByName || 'Admin User'} - ${action.toUpperCase()}`,
      approvedAt: new Date()
    }).returning()

    // Update project status
    if (!fileId) {
      // Project-level approval
      await db.update(projects).set({
          status: action === 'approve' ? 'COMPLETED' : 'REJECTED',
          lastActivity: new Date(),
          updatedAt: new Date()
        }).where(eq(projects.id, projectId))
    }

    // Emit socket event for real-time updates
    try {
      const { getSocketServer } = await import('@/lib/socket-server');
      const io = getSocketServer();
      
      if (io) {
        console.log(`📡 Emitting reviewStatusChanged for project ${projectId}, action: ${action}`);
        
        // Determine if this is from admin or client
        const isFromAdmin = approvedByName?.includes('Admin') || approverId === 'Admin';
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        
        // Emit review status changed event to all clients in the project room
        io.to(`project-${projectId}`).emit('reviewStatusChanged', {
          projectId: projectId,
          status: newStatus,
          action: action,
          changedBy: isFromAdmin ? 'Admin' : 'Client',
          changedByName: approvedByName || approverId,
          comment: comment,
          timestamp: new Date().toISOString(),
          isFromAdmin: isFromAdmin
        });
        
        console.log('✅ Socket event emitted successfully');
      } else {
        console.log('⚠️ Socket server not available');
      }
    } catch (error) {
      console.log('Socket emission error:', error)
    }

    return NextResponse.json({
      status: 'success',
      message: `Project ${action}d successfully`,
      data: approval
    })

  } catch (error) {
    console.error('Approval error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to process approval'
    }, { status: 500 })
  }
}

// GET - Get approval history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    const approvalsList = await db.select().from(approvals).where(eq(approvals.projectId, projectId)).orderBy(desc(approvals.approvedAt))

    return NextResponse.json({
      status: 'success',
      data: approvalsList
    })

  } catch (error) {
    console.error('Get approvals error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch approvals'
    }, { status: 500 })
  }
}
