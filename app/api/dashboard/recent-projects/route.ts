import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function handler(req: NextRequest, user: AuthUser) {
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const limit = parseInt(url.searchParams.get('limit') || '4')

      // Get recent projects with their latest review status
      const projects = await prisma.project.findMany({
        take: limit,
        orderBy: {
          updatedAt: 'desc'
        },
        include: {
          client: true,
          reviews: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1,
            select: {
              status: true,
              createdAt: true
            }
          }
        }
      })

      const recentProjects = projects.map(project => {
        const latestReview = project.reviews[0]
        const daysAgo = latestReview 
          ? Math.floor((Date.now() - new Date(latestReview.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : Math.floor((Date.now() - new Date(project.updatedAt).getTime()) / (1000 * 60 * 60 * 24))

        // Map review status to project status
        let status: 'pending' | 'approved' | 'revisions' | 'active' = 'active'
        if (latestReview) {
          switch (latestReview.status) {
            case 'PENDING':
              status = 'pending'
              break
            case 'APPROVED':
              status = 'approved'
              break
            case 'REJECTED':
              status = 'revisions'
              break
            case 'IN_PROGRESS':
              status = 'active'
              break
          }
        }

        return {
          id: project.id,
          name: project.title,
          client: project.client.name,
          status,
          daysAgo,
          thumbnail: `/placeholder.svg` // You can add thumbnail logic here
        }
      })

      return NextResponse.json({
        status: 'success',
        message: 'Recent projects retrieved successfully',
        data: recentProjects
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Method not allowed'
    }, { status: 405 })
  } catch (error) {
    console.error('Recent projects API error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export const GET = withAuth(handler)
