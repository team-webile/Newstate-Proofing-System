import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
import { withAuth, AuthUser } from '@/lib/auth'

async function handler(req: NextRequest, user: AuthUser) {
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const limit = parseInt(url.searchParams.get('limit') || '4')

      // Get recent projects with their client info
      const recentProjectsData = await db
        .select({
          id: projects.id,
          title: projects.title,
          updatedAt: projects.updatedAt,
          clientFirstName: clients.firstName,
          clientLastName: clients.lastName,
          clientId: clients.id
        })
        .from(projects)
        .leftJoin(clients, eq(projects.clientId, clients.id))
        .orderBy(desc(projects.updatedAt))
        .limit(limit)

      // Get latest review for each project
      const recentProjects = await Promise.all(
        recentProjectsData.map(async (project) => {
          const [latestReview] = await db
            .select({
              status: reviews.status,
              createdAt: reviews.createdAt
            })
            .from(reviews)
            .where(eq(reviews.projectId, project.id))
            .orderBy(desc(reviews.createdAt))
            .limit(1)

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
            client: `${project.clientFirstName} ${project.clientLastName}`,
            status,
            daysAgo,
            thumbnail: `/placeholder.svg` // You can add thumbnail logic here
          }
        })
      )

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
