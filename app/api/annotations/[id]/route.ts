import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

// DELETE /api/annotations/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'Annotation ID is required' },
        { status: 400 }
      )
    }

    await db.annotation.delete({
      where: { id }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Annotation deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting annotation:', error)
    return NextResponse.json(
      { status: 'error', message: 'Failed to delete annotation' },
      { status: 500 }
    )
  }
}
