import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    await prisma.annotation.delete({
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
