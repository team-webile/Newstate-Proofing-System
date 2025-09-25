import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function handler(req: NextRequest, user: AuthUser) {
  try {
    if (req.method === 'GET') {
      // Check database connection
      let dbStatus = 'operational'
      try {
        await prisma.$queryRaw`SELECT 1`
      } catch (error) {
        dbStatus = 'error'
      }

      // Check for any critical issues
      const criticalIssues = await prisma.comment.count({
        where: {
          status: 'ACTIVE',
          type: 'APPROVAL_REQUEST'
        }
      })

      // Determine overall system status
      let status: 'operational' | 'warning' | 'error' = 'operational'
      let message = 'All systems operational'

      if (dbStatus === 'error') {
        status = 'error'
        message = 'Database connection issues detected'
      } else if (criticalIssues > 10) {
        status = 'warning'
        message = `${criticalIssues} approval requests pending`
      }

      const systemStatus = {
        status,
        message,
        lastUpdated: new Date().toISOString()
      }

      return NextResponse.json({
        status: 'success',
        message: 'System status retrieved successfully',
        data: systemStatus
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Method not allowed'
    }, { status: 405 })
  } catch (error) {
    console.error('System status API error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export const GET = withAuth(handler)
