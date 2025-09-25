import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Update element status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, comment } = body

    if (!status) {
      return NextResponse.json({
        status: 'error',
        message: 'Status is required'
      }, { status: 400 })
    }

    // Find element
    const element = await prisma.element.findUnique({
      where: { id },
      include: {
        review: {
          include: {
            project: true
          }
        }
      }
    })

    if (!element) {
      return NextResponse.json({
        status: 'error',
        message: 'Element not found'
      }, { status: 404 })
    }

    // Update element status
    const updatedElement = await prisma.element.update({
      where: { id },
      data: {
        status: status as any
      }
    })

    // Add comment if provided
    if (comment) {
      await prisma.comment.create({
        data: {
          elementId: id,
          commentText: comment,
          userName: 'System',
          type: 'GENERAL',
          status: 'ACTIVE'
        }
      })
    }

    return NextResponse.json({
      status: 'success',
      message: 'Element status updated successfully',
      data: {
        id: updatedElement.id,
        status: updatedElement.status,
        updatedAt: updatedElement.updatedAt
      }
    })

  } catch (error) {
    console.error('Element status update error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to update element status'
    }, { status: 500 })
  }
}
