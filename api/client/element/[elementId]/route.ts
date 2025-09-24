import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ elementId: string }> }
) {
  try {
    const { elementId } = await params

    // Fetch element with all related data
    const element = await prisma.element.findUnique({
      where: { id: elementId },
      include: {
        versions: {
          orderBy: { version: 'desc' }
        },
        comments: {
          include: {
            replies: {
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        review: {
          include: {
            project: {
              include: {
                client: true
              }
            }
          }
        }
      }
    })

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
    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Update element status
    const updatedElement = await prisma.element.update({
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
