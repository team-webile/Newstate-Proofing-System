import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

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
    const annotation = await db.annotation.update({
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
    await db.annotationNotification.create({
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
