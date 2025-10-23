import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getEmailQueueStats } from '@/lib/email-queue'
import { getProcessorHealth } from '@/lib/email-processor'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'overview'
    
    switch (action) {
      case 'overview':
        return await getOverview()
      case 'recent':
        return await getRecentEmails()
      case 'failed':
        return await getFailedEmails()
      case 'stats':
        return await getDetailedStats()
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: overview, recent, failed, stats' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ Error in email debug:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

async function getOverview() {
  const queueStats = await getEmailQueueStats()
  const health = await getProcessorHealth()
  
  return NextResponse.json({
    success: true,
    overview: {
      queue: queueStats,
      health: health,
      timestamp: new Date().toISOString()
    }
  })
}

async function getRecentEmails() {
  const recentEmails = await prisma.emailQueue.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      to: true,
      subject: true,
      status: true,
      attempts: true,
      createdAt: true,
      sentAt: true,
      errorMessage: true,
      metadata: true
    }
  })
  
  return NextResponse.json({
    success: true,
    recentEmails
  })
}

async function getFailedEmails() {
  const failedEmails = await prisma.emailQueue.findMany({
    where: { status: 'FAILED' },
    orderBy: { lastAttempt: 'desc' },
    take: 20,
    select: {
      id: true,
      to: true,
      subject: true,
      attempts: true,
      maxAttempts: true,
      lastAttempt: true,
      nextAttempt: true,
      errorMessage: true,
      metadata: true
    }
  })
  
  return NextResponse.json({
    success: true,
    failedEmails
  })
}

async function getDetailedStats() {
  // Get stats by status
  const statusStats = await prisma.emailQueue.groupBy({
    by: ['status'],
    _count: { id: true },
    _avg: { attempts: true }
  })
  
  // Get stats by hour for last 24 hours
  const hourlyStats = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('hour', created_at) as hour,
      status,
      COUNT(*) as count
    FROM email_queue 
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY DATE_TRUNC('hour', created_at), status
    ORDER BY hour DESC
  `
  
  // Get top recipients
  const topRecipients = await prisma.emailQueue.groupBy({
    by: ['to'],
    _count: { id: true },
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  })
  
  return NextResponse.json({
    success: true,
    detailedStats: {
      statusStats,
      hourlyStats,
      topRecipients
    }
  })
}
