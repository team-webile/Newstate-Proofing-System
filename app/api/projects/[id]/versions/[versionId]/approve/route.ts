import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

// POST - Approve version
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id: projectId, versionId } = await params
    const body = await req.json()
    const { approvedBy, approvedAt } = body

    // Verify project exists
    const project = await db.project.select().from(table).where(eq(table.id, id))

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    const updatedVersion = await db.version.update({
      where: { id: versionId, projectId: projectId },
      data: {
        status: 'APPROVED',
        approvedBy: approvedBy,
        approvedAt: approvedAt
      }
    })
    
    return NextResponse.json({
      status: 'success',
      message: 'Version approved successfully',
      data: updatedVersion
    })

  } catch (error) {
    console.error('Approve version error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to approve version'
    }, { status: 500 })
  }
}
