import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function handler(req: NextRequest, user: AuthUser) {
  try {
    if (req.method === 'GET') {
      // Get total clients
      const totalClients = await prisma.client.count()

      // Get total projects
      const totalProjects = await prisma.project.count()

      // Get pending projects (projects with pending reviews)
      const pendingProjects = await prisma.project.count({
        where: {
          reviews: {
            some: {
              status: 'PENDING'
            }
          }
        }
      })

      // Get active projects (projects with in-progress reviews)
      const activeProjects = await prisma.project.count({
        where: {
          reviews: {
            some: {
              status: 'IN_PROGRESS'
            }
          }
        }
      })

      const stats = {
        totalClients,
        totalProjects,
        pendingProjects,
        activeProjects
      }

      return NextResponse.json({
        status: 'success',
        message: 'Dashboard stats retrieved successfully',
        data: stats
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Method not allowed'
    }, { status: 405 })
  } catch (error) {
    console.error('Dashboard stats API error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export const GET = withAuth(handler)
