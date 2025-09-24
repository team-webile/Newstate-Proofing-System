import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ shareLink: string }> }) {
  try {
    const { shareLink } = await params

    // First try to find review by shareLink
    const review = await prisma.review.findUnique({
      where: { shareLink },
      include: {
        project: {
          include: {
            user: true,
            approvals: true,
          }
        },
        elements: {
          include: {
            versions: true,
            comments: true,
            approvals: true,
          },
        },
      },
    })

    // If no review found by shareLink, try to find by project ID
    if (!review) {
      const project = await prisma.project.findUnique({
        where: { id: shareLink },
        include: {
          user: true,
          approvals: true,
          reviews: {
            include: {
              elements: {
                include: {
                  versions: true,
                  comments: true,
                  approvals: true,
                },
              },
            },
          },
        },
      })

      if (!project) {
        return NextResponse.json({ 
          status: 'error', 
          message: 'Project not found' 
        }, { status: 404 })
      }

      // Return the project data with all reviews
      return NextResponse.json({
        status: 'success',
        message: 'Project retrieved successfully',
        data: project
      })
    }

    // Return the project data with the review
    const project = {
      ...review.project,
      reviews: [review]
    }

    return NextResponse.json({
      status: 'success',
      message: 'Project retrieved successfully',
      data: project
    })
  } catch (error) {
    console.error('Get project by share link error:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
