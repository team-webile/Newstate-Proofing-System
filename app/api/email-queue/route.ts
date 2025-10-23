import { NextRequest, NextResponse } from 'next/server'
import { 
  getEmailQueueStats, 
  getEmailsToProcess, 
  cleanupOldEmails,
  cancelEmails 
} from '@/lib/email-queue'
import { processEmailsNow } from '@/lib/email-processor'

// GET - Get email queue statistics
export async function GET(request: NextRequest) {
  try {
    const stats = await getEmailQueueStats()
    
    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('❌ Error getting email queue stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// POST - Process emails immediately
export async function POST(request: NextRequest) {
  try {
    const { action, batchSize = 10 } = await request.json()
    
    switch (action) {
      case 'process':
        const results = await processEmailsNow({ batchSize })
        return NextResponse.json({
          success: true,
          results
        })
        
      case 'cleanup':
        const cleanedCount = await cleanupOldEmails()
        return NextResponse.json({
          success: true,
          cleanedCount
        })
        
      case 'cancel':
        const { criteria } = await request.json()
        const cancelledCount = await cancelEmails(criteria)
        return NextResponse.json({
          success: true,
          cancelledCount
        })
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ Error processing email queue action:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
