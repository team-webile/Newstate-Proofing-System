import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    // Create approval record
    const approval = await prisma.approval.create({
      data: {
        type: fileId ? 'ELEMENT' : 'PROJECT',
        projectId: projectId,
        elementId: fileId,
        userName: approvedByName || 'Admin User',
        signature: `${approvedByName || 'Admin User'} - ${action.toUpperCase()}`
      }
    })

    // Update project status
    if (!fileId) {
      // Project-level approval
      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: action === 'approve' ? 'COMPLETED' : 'ACTIVE',
          lastActivity: new Date()
        }
      })
    }

    // Emit socket event for real-time updates
    try {
      // Note: Socket emission would happen here in a real implementation
      console.log(`Project ${action}d: ${projectId}`)
    } catch (error) {
      console.log('Socket emission skipped:', error)
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
  } finally {
    await prisma.$disconnect()
  }
}

// GET - Get approval history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    const approvals = await prisma.approval.findMany({
      where: { projectId },
      orderBy: { approvedAt: 'desc' }
    })

    return NextResponse.json({
      status: 'success',
      data: approvals
    })

  } catch (error) {
    console.error('Get approvals error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch approvals'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
