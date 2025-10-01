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
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003';
      console.log('📡 Sending project status change to socket server:', socketUrl);
      
      const newStatus = action === 'approve' ? 'COMPLETED' : 'REJECTED';
      
      // Send HTTP request to trigger socket emission
      await fetch(`${socketUrl}/api/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'projectStatusChanged',
          room: `project-${projectId}`,
          data: {
            projectId: projectId,
            status: newStatus,
            changedBy: approverId,
            changedByName: approvedByName || approverId,
            comments: comment,
            timestamp: new Date().toISOString()
          }
        })
      }).catch(err => console.log('Socket emit failed:', err));
      
      console.log(`✅ Project ${action}d socket event sent successfully`);
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
