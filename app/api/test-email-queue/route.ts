import { NextRequest, NextResponse } from 'next/server'
import { addToEmailQueue } from '@/lib/email-queue'
import { processEmailsNow } from '@/lib/email-processor'

export async function POST(request: NextRequest) {
  try {
    const { action, email, subject, message } = await request.json()

    if (action === 'add') {
      // Add a test email to the queue
      const result = await addToEmailQueue({
        to: email || 'ladinawan4@gmail.com',
        subject: subject || 'Test Email from Queue System',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; }
              .footer { background: #2d2d2d; color: #999; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">📧 Email Queue Test</h1>
              </div>
              
              <div class="content">
                <p style="font-size: 16px; margin-top: 0;">This is a test email from the email queue system.</p>
                
                <div style="background: white; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="margin-top: 0; color: #f59e0b;">Test Message:</h3>
                  <p style="white-space: pre-wrap; margin: 0;">${message || 'This is a test message to verify the email queue system is working correctly.'}</p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  This email was processed through the email queue system, ensuring reliable delivery.
                </p>
              </div>
              
              <div class="footer">
                <p style="margin: 5px 0;">Newstate Branding Co. - Proofing System</p>
                <p style="margin: 5px 0;">Email Queue Test - ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: `
Email Queue Test

This is a test email from the email queue system.

Test Message:
${message || 'This is a test message to verify the email queue system is working correctly.'}

This email was processed through the email queue system, ensuring reliable delivery.

---
Newstate Branding Co. - Proofing System
Email Queue Test - ${new Date().toLocaleString()}
        `.trim(),
        priority: 1,
        metadata: {
          type: 'test_email',
          timestamp: new Date().toISOString()
        }
      })

      return NextResponse.json({
        success: result.success,
        message: result.success ? 'Test email added to queue' : 'Failed to add email to queue',
        emailId: result.id,
        error: result.error
      })
    }

    if (action === 'process') {
      // Process emails from the queue
      const results = await processEmailsNow({ batchSize: 5 })
      
      return NextResponse.json({
        success: true,
        message: 'Emails processed',
        results
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "add" or "process"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Error in test email queue:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Email Queue Test API',
    endpoints: {
      'POST /api/test-email-queue': {
        description: 'Test email queue functionality',
        actions: ['add', 'process'],
        parameters: {
          add: {
            action: 'add',
            email: 'ladinawan4@gmail.com',
            subject: 'Test Subject',
            message: 'Test message content'
          },
          process: {
            action: 'process'
          }
        }
      }
    }
  })
}
