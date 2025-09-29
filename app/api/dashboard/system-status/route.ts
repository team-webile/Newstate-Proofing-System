import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
import { withAuth, AuthUser } from '@/lib/auth'

async function handler(req: NextRequest, user: AuthUser) {
  try {
    if (req.method === 'GET') {
      // Check database connection
      let dbStatus = 'operational'
      try {
        await db.select().from(clients).limit(1)
      } catch (error) {
        dbStatus = 'error'
      }

      // Check for any critical issues
      const [criticalIssuesResult] = await db
        .select({ count: count() })
        .from(comments)
        .where(and(
          eq(comments.status, 'ACTIVE'),
          eq(comments.type, 'APPROVAL_REQUEST')
        ))

      const criticalIssues = criticalIssuesResult?.count || 0

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
