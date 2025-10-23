import { NextRequest, NextResponse } from 'next/server'
import { addToEmailQueue } from '@/lib/email-queue'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json()

    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: to, subject, message' },
        { status: 400 }
      )
    }

    // Add email to queue
    const result = await addToEmailQueue({
      to,
      subject,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #333;">📧 Newstate Proofing System Test</h2>
          <p>${message}</p>
          <hr>
          <small style="color: #999;">Sent at: ${new Date().toLocaleString()}</small>
        </div>
      `,
      textContent: `Newstate Proofing System Test\n\n${message}\n\nSent at: ${new Date().toLocaleString()}`,
      from: 'art@newstatebranding.com',
      priority: 0,
      metadata: {
        type: 'test_email',
        timestamp: new Date().toISOString()
      }
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email queued successfully!',
        emailId: result.id,
        recipient: to,
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to queue email',
          error: result.error,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Email queuing error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to queue email',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// ✅ GET method for simple test email
export async function GET() {
  try {
    // Add test email to queue
    const result = await addToEmailQueue({
      to: 'ladinawan4@gmail.com',
      subject: '✅ Test Email from Newstate Proofing System',
      htmlContent: `
        <div style="font-family: Arial, sans-serif;">
          <h2>SMTP Test Successful 🎉</h2>
          <p>This email confirms your IONOS SMTP setup is working.</p>
          <small style="color: gray;">Sent at: ${new Date().toLocaleString()}</small>
        </div>
      `,
      textContent: `SMTP Test Successful 🎉\n\nThis email confirms your IONOS SMTP setup is working.\n\nSent at: ${new Date().toLocaleString()}`,
      from: 'art@newstatebranding.com',
      priority: 1, // High priority for test emails
      metadata: {
        type: 'test_email',
        timestamp: new Date().toISOString()
      }
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email queued successfully!',
        emailId: result.id,
        recipient: 'ladinawan4@gmail.com',
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to queue test email',
          error: result.error,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Email queuing error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to queue test email',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
