import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ elementId: string }> }
) {
  try {
    const { elementId } = await params

    // Fetch element with all related data
    const element = await db.element.select().from(table).where(eq(table.id, id))

    if (!element) {
      return NextResponse.json(
        { status: 'error', message: 'Element not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: 'success',
      element: {
        id: element.id,
        elementName: element.elementName,
        filePath: element.filePath,
        version: element.version,
        status: element.status,
        versions: element.versions,
        comments: element.comments
      },
      project: element.review.project
    })
  } catch (error) {
    console.error('Error fetching element:', error)
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ elementId: string }> }
) {
  try {
    const { elementId } = await params
    const { status } = await request.json()

    // Update element status
    const updatedElement = await db.element.update({
      where: { id: elementId },
      data: { status },
      include: {
        review: {
          include: {
            project: {
              select: {
                id: true
              }
            }
          }
        }
      }
    })

    // Emit socket event for real-time updates
    try {
      const { SocketManager } = await import('@/lib/socket')
      if (SocketManager) {
        SocketManager.emitElementStatusUpdate(updatedElement.review.project.id, updatedElement.id, updatedElement.status)
      }
    } catch (socketError) {
      console.error('Socket error (non-critical):', socketError)
      // Don't fail the request if socket fails
    }

    return NextResponse.json({
      status: 'success',
      element: updatedElement
    })
  } catch (error) {
    console.error('Error updating element:', error)
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
