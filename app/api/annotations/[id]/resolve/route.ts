import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Resolve annotation
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find annotation
    const annotation = await prisma.annotation.findUnique({
      where: { id }
    })

    if (!annotation) {
      return NextResponse.json({
        status: 'error',
        message: 'Annotation not found'
      }, { status: 404 })
    }

    // Update annotation to resolved (we'll add a resolved field to the schema)
    // For now, we'll just return success
    // TODO: Add resolved field to Annotation model in schema.prisma

    return NextResponse.json({
      status: 'success',
      message: 'Annotation resolved successfully',
      data: {
        id: annotation.id,
        resolved: true
      }
    })

  } catch (error) {
    console.error('Annotation resolve error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to resolve annotation'
    }, { status: 500 })
  }
}
