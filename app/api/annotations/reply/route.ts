import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { annotationId, content, addedBy, addedByName } = await request.json()

    console.log('Creating annotation reply:', { annotationId, content, addedBy, addedByName })

    if (!annotationId || !content || !addedBy) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify annotation exists
    const annotation = await prisma.annotation.findUnique({
      where: { id: annotationId }
    })

    if (!annotation) {
      return NextResponse.json(
        { status: 'error', message: 'Annotation not found' },
        { status: 404 }
      )
    }

    // Create the reply in database
    const reply = await (prisma as any).annotationReply.create({
      data: {
        annotationId,
        content,
        addedBy,
        addedByName: addedByName || addedBy,
      },
    })

    console.log('Reply created successfully:', reply)

    return NextResponse.json({
      status: 'success',
      data: reply,
    })
  } catch (error) {
    console.error('Error creating annotation reply:', error)
    return NextResponse.json(
      { status: 'error', message: 'Failed to create reply' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
