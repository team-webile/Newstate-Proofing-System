import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { addToEmailQueue } from '@/lib/email-queue'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// POST - Send password reset email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 3600000) // 1 hour from now

    // Store reset token in database
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: resetExpires,
      }
    })

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'https://preview.devnstage.xyz'}/reset-password?token=${resetToken}`

    // Send email
    const emailSubject = 'Password Reset Request - NewState Branding'
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: #fff; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { 
            display: inline-block; 
            background: #eab308; 
            color: #000; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: bold;
            margin: 20px 0;
          }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NewState Branding</h1>
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p>We received a request to reset your password for your admin account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 NewState Branding Co. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const emailText = `
      Password Reset Request - NewState Branding
      
      Hello ${user.firstName},
      
      We received a request to reset your password for your admin account.
      
      Click this link to reset your password: ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this password reset, please ignore this email.
      
      © 2025 NewState Branding Co. All rights reserved.
    `

    try {
      const result = await addToEmailQueue({
        to: email,
        subject: emailSubject,
        htmlContent: emailHtml,
        textContent: emailText,
        from: 'art@newstatebranding.com',
        priority: 1, // High priority for password reset
        metadata: {
          type: 'password_reset',
          userId: user.id,
          email: user.email
        }
      })

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Password reset email sent successfully',
        })
      } else {
        console.error('Failed to queue password reset email:', result.error)
        return NextResponse.json(
          { error: 'Failed to send email. Please try again later.' },
          { status: 500 }
        )
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email. Please try again later.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
