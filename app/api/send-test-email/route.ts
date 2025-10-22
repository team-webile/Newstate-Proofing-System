import { NextRequest, NextResponse } from 'next/server'
import * as nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json()

    // Validate required fields
    if (!to || !subject || !message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: to, subject, message',
        },
        { status: 400 }
      )
    }

    // Validate environment variables
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD
    const smtpHost = process.env.SMTP_HOST || 'smtp.ionos.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '465')

    if (!smtpUser || !smtpPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'SMTP configuration is missing. Please set SMTP_USER and SMTP_PASSWORD environment variables.',
        },
        { status: 500 }
      )
    }

    // Create transporter using SMTP settings from environment variables
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    })

    // Verify connection configuration
    await transporter.verify()

    // Email options
    const mailOptions = {
      from: smtpUser,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test Email from Newstate Proofing System</h2>
          <p style="color: #666; line-height: 1.6;">${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            This is a test email sent from the Newstate Proofing System API.
            <br>
            Sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: `${message}\n\nThis is a test email sent from the Newstate Proofing System API.\nSent at: ${new Date().toLocaleString()}`,
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    return NextResponse.json(
      {
        success: true,
        message: 'Test email sent successfully',
        messageId: info.messageId,
        recipient: to,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email sending error:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// GET method to send a test email
export async function GET() {
  try {
    // Validate environment variables
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD
    const smtpHost = process.env.SMTP_HOST || 'smtp.ionos.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '465')
    const adminEmail = process.env.ADMIN_EMAIL || smtpUser

    if (!smtpUser || !smtpPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'SMTP configuration is missing. Please set SMTP_USER and SMTP_PASSWORD environment variables.',
        },
        { status: 500 }
      )
    }

    const transporter = nodemailer.createTransporter({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    })

    await transporter.verify()

    const mailOptions = {
      from: smtpUser,
      to: adminEmail,
      subject: 'Test Email from Newstate Proofing System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test Email from Newstate Proofing System</h2>
          <p style="color: #666; line-height: 1.6;">
            This is a test email to verify that the email sending functionality is working correctly.
          </p>
          <p style="color: #666; line-height: 1.6;">
            If you receive this email, it means the SMTP configuration is properly set up and emails can be sent from the system.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated test email sent from the Newstate Proofing System API.
            <br>
            Sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: `This is a test email to verify that the email sending functionality is working correctly.\n\nIf you receive this email, it means the SMTP configuration is properly set up and emails can be sent from the system.\n\nThis is an automated test email sent from the Newstate Proofing System API.\nSent at: ${new Date().toLocaleString()}`,
    }

    const info = await transporter.sendMail(mailOptions)

    return NextResponse.json(
      {
        success: true,
        message: `Test email sent successfully to ${adminEmail}`,
        messageId: info.messageId,
        recipient: adminEmail,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email sending error:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
