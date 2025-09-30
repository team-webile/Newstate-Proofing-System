import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    // Generate unique share link
    const shareLink = `share-${projectId}-${Date.now()}`

    console.log('Share link generated:', shareLink)

    // Get project details to find clientId
    const project = await db.project.select().from(table).where(eq(table.id, id))

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    // Generate client URL format
    const clientUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://preview.devnstage.xyz'}/client/${project.clientId}?project=${projectId}`

    return NextResponse.json({
      status: 'success',
      message: 'Share link generated successfully',
      data: {
        shareLink: shareLink,
        fullUrl: clientUrl,
        projectId: projectId,
        clientId: project.clientId
      }
    })

  } catch (error) {
    console.error('Share link generation error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to generate share link'
    }, { status: 500 })
  }
}
