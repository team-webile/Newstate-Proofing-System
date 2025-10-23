import { NextRequest, NextResponse } from 'next/server'
import { getEmailQueueStats } from '@/lib/email-queue'
import { getProcessorHealth } from '@/lib/email-processor'

export async function GET(request: NextRequest) {
  try {
    // Get email queue statistics
    const queueStats = await getEmailQueueStats()
    
    // Get processor health
    const health = await getProcessorHealth()
    
    // Calculate health score
    const healthScore = calculateHealthScore(queueStats, health)
    
    return NextResponse.json({
      success: true,
      health: {
        score: healthScore,
        status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical',
        queue: queueStats,
        processor: health,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Error checking email health:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        health: {
          score: 0,
          status: 'critical',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}

function calculateHealthScore(queueStats: any, health: any): number {
  let score = 100
  
  // Deduct points for failed emails
  if (queueStats.failed > 0) {
    score -= Math.min(queueStats.failed * 5, 30) // Max 30 points deduction
  }
  
  // Deduct points for high pending count
  if (queueStats.pending > 50) {
    score -= 20
  } else if (queueStats.pending > 20) {
    score -= 10
  }
  
  // Deduct points for processor issues
  if (!health.healthy) {
    score -= 40
  }
  
  // Deduct points for stuck emails
  if (health.issues && health.issues.length > 0) {
    score -= health.issues.length * 10
  }
  
  return Math.max(0, score)
}
