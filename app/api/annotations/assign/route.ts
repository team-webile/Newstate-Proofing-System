import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const { annotationId, assignedTo, assignedBy } = await request.json()

    if (!annotationId || !assignedTo) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update annotation assignment
    const annotation = await prisma.annotation.update({
      where: { id: annotationId },
      data: {
        assignedTo,
      },
      include: {
        replies: true,
        notifications: true
      }
    })

    // Create notification for assignment
    await prisma.annotationNotification.create({
      data: {
        annotationId,
        userId: assignedTo,
        type: 'ANNOTATION_ASSIGNED',
        message: `Annotation assigned to you by ${assignedBy}`
      }
    })

    return NextResponse.json({
      status: 'success',
      data: annotation,
    })
  } catch (error) {
    console.error('Error assigning annotation:', error)
    return NextResponse.json(
      { status: 'error', message: 'Failed to assign annotation' },
      { status: 500 }
    )
  }
}
