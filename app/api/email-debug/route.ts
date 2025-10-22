import { NextRequest, NextResponse } from 'next/server'
import { processEmailNotification } from '@/lib/email'

export async function GET() {
  try {
    // Test email with minimal data
    const testData = {
      clientName: 'Test User',
      clientEmail: 'ladinawan4@gmail.com',
      commentContent: 'Test email from server',
      projectName: 'Test Project',
      projectNumber: 'TEST-001',
      reviewLink: 'https://review.newstatebranding.com/review/test',
      designFileName: 'test.jpg',
      commentType: 'comment' as const
    }

    const result = await processEmailNotification(testData, true)
    
    return NextResponse.json({
      success: result.success,
      error: result.error,
      details: result.details,
      environment: process.env.NODE_ENV,
      smtpConfig: {
        host: process.env.SMTP_HOST || 'smtp.ionos.com',
        port: process.env.SMTP_PORT || '465',
        user: process.env.SMTP_USER || 'art@newstatebranding.com',
        hasPassword: !!process.env.SMTP_PASS
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      environment: process.env.NODE_ENV
    }, { status: 500 })
  }
}
