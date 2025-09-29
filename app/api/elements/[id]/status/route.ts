import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

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
    const element = await db.element.select().from(table).where(eq(table.id, id))

    if (!element) {
      return NextResponse.json({
        status: 'error',
        message: 'Element not found'
      }, { status: 404 })
    }

    // Update element status
    const updatedElement = await db.element.update({
      where: { id },
      data: {
        status: status as any
      }
    })

    // Add comment if provided
    if (comment) {
      await db.insert(comment).values({
          elementId: id,
          commentText: comment,
          userName: 'System',
          type: 'GENERAL',
          status: 'ACTIVE'
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
