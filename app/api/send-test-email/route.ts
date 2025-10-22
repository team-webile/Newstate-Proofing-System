import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json()

    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: to, subject, message' },
        { status: 400 }
      )
    }

    // ✅ Create transporter (IONOS SMTP)
    const transporter = nodemailer.createTransport({
      host: 'smtp.ionos.com',
      port: 465,
      secure: true,
      auth: {
        user: 'art@newstatebranding.com',
        pass: 'Suspect3*_*',
      },
    })

    // ✅ Verify connection
    await transporter.verify()

    // ✅ Email options
    const mailOptions = {
      from: 'art@newstatebranding.com',
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #333;">📧 Newstate Proofing System Test</h2>
          <p>${message}</p>
          <hr>
          <small style="color: #999;">Sent at: ${new Date().toLocaleString()}</small>
        </div>
      `,
    }

    // ✅ Send email
    const info = await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully!',
      messageId: info.messageId,
      recipient: to,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// ✅ GET method for simple test email
export async function GET() {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.ionos.com',
      port: 465,
      secure: true,
      auth: {
        user: 'art@newstatebranding.com',
        pass: 'Suspect3*_*',
      },
    })

    await transporter.verify()

    const mailOptions = {
      from: 'art@newstatebranding.com',
      to: 'ladinawan4@gmail.com',
      subject: '✅ Test Email from Newstate Proofing System',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>SMTP Test Successful 🎉</h2>
          <p>This email confirms your IONOS SMTP setup is working.</p>
          <small style="color: gray;">Sent at: ${new Date().toLocaleString()}</small>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      messageId: info.messageId,
      recipient: 'art@newstatebranding.com',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
