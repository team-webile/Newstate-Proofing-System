import { prisma } from './db'
import { addToEmailQueue } from './email-queue'

// Email configuration - using environment variables for better server compatibility
const getEmailTransporter = async () => {
  // Import nodemailer dynamically
  const nodemailer = (await import('nodemailer')).default

  // Get configuration from environment variables with fallbacks
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.ionos.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
      user: process.env.SMTP_USER || 'art@newstatebranding.com',
      pass: process.env.SMTP_PASS || 'Suspect3*_*',
    },
  }

  console.log('📧 SMTP Configuration:', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    user: smtpConfig.auth.user
  })

  return nodemailer.createTransport(smtpConfig)
}

// Get admin email directly from database
async function getAdminEmail(): Promise<string> {
  try {
    console.log('🔍 Getting admin email for client notifications...')

    // Always use art@newstatebranding.com for client notifications
    const adminEmail = 'art@newstatebranding.com'
    console.log('✅ Using admin email for client notifications:', adminEmail)
    return adminEmail

  } catch (error) {
    console.error('❌ Error getting admin email:', error)
    // Fallback to the specified email
    console.log('📧 Using fallback admin email: art@newstatebranding.com')
    return 'art@newstatebranding.com'
  }
}

// Get sender email
function getSenderEmail(): string {
  return process.env.FROM_EMAIL || 'art@newstatebranding.com'
}

interface CommentNotificationData {
  clientName: string
  clientEmail?: string
  commentContent: string
  projectName: string
  projectNumber: string
  reviewLink: string
  designFileName: string
  commentType?: 'comment' | 'annotation'
}

/**
 * Send email notification to admin when client sends a message
 */
export async function sendClientMessageNotificationToAdmin(
  data: CommentNotificationData
): Promise<{ success: boolean; emailSentTo?: string }> {
  try {
    console.log('📧 Queuing admin notification...')

    const adminEmail = await getAdminEmail()
    console.log('📧 Admin email retrieved:', adminEmail)

    const fromEmail = getSenderEmail()
    console.log('📧 From email:', fromEmail)

    // Create admin review link (for admin to view)
    const adminReviewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://preview.devnstage.xyz'}/admin/review/${data.reviewLink.split('/review/')[1] || data.reviewLink}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; }
          .message-box { background: white; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .info-row { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { background: #2d2d2d; color: #999; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
        </style>
      </head> 
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">${data.commentType === 'annotation' ? '📝 Client Added Annotation' : '💬 Client Left Comment'}</h1>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; margin-top: 0;">A client has ${data.commentType === 'annotation' ? 'added an annotation to' : 'left a comment on'} your project:</p>
            
            <div class="info-row">
              <span class="label">Client Name:</span>
              <span class="value">${data.clientName}</span>
            </div>
            
            ${data.clientEmail ? `
            <div class="info-row">
              <span class="label">Client Email:</span>
              <span class="value">${data.clientEmail}</span>
            </div>
            ` : ''}
            
            <div class="info-row">
              <span class="label">Project:</span>
              <span class="value">${data.projectName} (${data.projectNumber})</span>
            </div>
            
            <div class="info-row">
              <span class="label">Design File:</span>
              <span class="value">${data.designFileName}</span>
            </div>
            
            <div class="message-box">
              <h3 style="margin-top: 0; color: #f59e0b;">Message:</h3>
              <p style="white-space: pre-wrap; margin: 0;">${data.commentContent}</p>
            </div>
            
             <div style="text-align: center;">
               <a href="${adminReviewLink}" class="button">View Review & Reply</a>
             </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Click the button above to view the full review and respond to the client's message.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;">Newstate Branding Co. - Proofing System</p>
            <p style="margin: 5px 0;">Notification sent at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
Client Left Comment

Client Name: ${data.clientName}
${data.clientEmail ? `Client Email: ${data.clientEmail}\n` : ''}
Project: ${data.projectName} (${data.projectNumber})
Design File: ${data.designFileName}

Message:
${data.commentContent}

View and reply to this message: ${adminReviewLink}

---
Newstate Branding Co. - Proofing System
Notification sent at ${new Date().toLocaleString()}
    `.trim()

    // Add to email queue
    const result = await addToEmailQueue({
      to: adminEmail,
      subject: `Client ${data.commentType === 'annotation' ? 'Added Annotation' : 'Left Comment'} - ${data.projectName} (${data.projectNumber})`,
      htmlContent,
      textContent,
      from: fromEmail,
      priority: 1, // High priority for admin notifications
      metadata: {
        type: 'admin_notification',
        projectName: data.projectName,
        projectNumber: data.projectNumber,
        clientName: data.clientName,
        commentType: data.commentType
      }
    })

    if (result.success) {
      console.log(`✅ Admin notification queued for client message from ${data.clientName}`)
      console.log(`📧 Email queued for: ${adminEmail}`)
      return { success: true, emailSentTo: adminEmail }
    } else {
      console.error('❌ Failed to queue admin notification:', result.error)
      return { success: false }
    }
  } catch (error) {
    console.error('❌ Error queuing admin notification:', error)
    return { success: false }
  }
}

/**
 * Send email notification to client when admin replies
 */
export async function sendAdminReplyNotificationToClient(
  data: CommentNotificationData
): Promise<{ success: boolean; emailSentTo?: string }> {
  try {
    if (!data.clientEmail) {
      console.log('⚠️ No client email provided, skipping notification')
      return { success: false }
    }

    console.log('📧 Queuing client notification...')
    const fromEmail = getSenderEmail()

    // Create client review link (for client to view)
    const clientReviewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://preview.devnstage.xyz'}/review/${data.reviewLink.split('/review/')[1] || data.reviewLink}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; }
          .message-box { background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .info-row { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { background: #2d2d2d; color: #999; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">💬 Design Team Replied</h1>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; margin-top: 0;">Dear ${data.clientEmail},</p>

            <p>Your design team has replied to your message regarding your project:</p>
            
            <div class="info-row">
              <span class="label">Project:</span>
              <span class="value">${data.projectName} (${data.projectNumber})</span>
            </div>
            
            <div class="info-row">
              <span class="label">Design File:</span>
              <span class="value">${data.designFileName}</span>
            </div>
            
            <div class="message-box">
              <h3 style="margin-top: 0; color: #10b981;">Reply:</h3>
              <p style="white-space: pre-wrap; margin: 0;">${data.commentContent}</p>
            </div>
            
             <div style="text-align: center;">
               <a href="${clientReviewLink}" class="button">View Review & Continue Conversation</a>
             </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Click the button above to view the full conversation and continue discussing your project.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;">Newstate Branding Co. - Proofing System</p>
            <p style="margin: 5px 0;">This is an automated notification from your design team</p>
            <p style="margin: 5px 0;">Sent at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
Design Team Replied

Hello ${data.clientName},

Your design team has replied to your message regarding your project.

Project: ${data.projectName} (${data.projectNumber})
Design File: ${data.designFileName}

Reply:
${data.commentContent}

View the full conversation: ${clientReviewLink}

---
Newstate Branding Co. - Proofing System
Sent at ${new Date().toLocaleString()}
    `.trim()

    // Add to email queue
    const result = await addToEmailQueue({
      to: data.clientEmail,
      subject: `Design Team Replied - ${data.projectName} (${data.projectNumber})`,
      htmlContent,
      textContent,
      from: fromEmail,
      priority: 1, // High priority for client notifications
      metadata: {
        type: 'client_notification',
        projectName: data.projectName,
        projectNumber: data.projectNumber,
        clientName: data.clientName
      }
    })

    if (result.success) {
      console.log(`✅ Client notification queued for ${data.clientEmail}`)
      return { success: true, emailSentTo: data.clientEmail }
    } else {
      console.error('❌ Failed to queue client notification:', result.error)
      return { success: false }
    }
  } catch (error) {
    console.error('❌ Error queuing client notification:', error)
    return { success: false }
  }
}

/**
 * Send email notification to admin when client approves project
 */
export async function sendProjectApprovalNotificationToAdmin(
  data: {
    clientName: string
    clientEmail?: string
    projectName: string
    projectNumber: string
    reviewLink: string
    approvedAt: string
  }
): Promise<{ success: boolean; emailSentTo?: string }> {
  try {
    console.log('📧 Queuing admin approval notification...')

    const adminEmail = await getAdminEmail()
    console.log('📧 Admin email retrieved:', adminEmail)

    const fromEmail = getSenderEmail()
    console.log('📧 From email:', fromEmail)

    // Create admin review link (for admin to view)
    const adminReviewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://preview.devnstage.xyz'}/admin/review/${data.reviewLink.split('/review/')[1] || data.reviewLink}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; }
          .approval-box { background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .info-row { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { background: #2d2d2d; color: #999; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🎉 Project Approved!</h1>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; margin-top: 0;">Great news! A client has approved their project:</p>
            
            <div class="info-row">
              <span class="label">Client Name:</span>
              <span class="value">${data.clientName}</span>
            </div>
            
            ${data.clientEmail ? `
            <div class="info-row">
              <span class="label">Client Email:</span>
              <span class="value">${data.clientEmail}</span>
            </div>
            ` : ''}
            
            <div class="info-row">
              <span class="label">Project:</span>
              <span class="value">${data.projectName} (${data.projectNumber})</span>
            </div>
            
            <div class="info-row">
              <span class="label">Approved At:</span>
              <span class="value">${data.approvedAt}</span>
            </div>
            
            <div class="approval-box">
              <h3 style="margin-top: 0; color: #10b981;">✅ Project Approved</h3>
              <p style="margin: 0;">The client has officially approved this project and is satisfied with the final design.</p>
            </div>
            
             <div style="text-align: center;">
               <a href="${adminReviewLink}" class="button">View Approved Project</a>
             </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Click the button above to view the approved project and proceed with final delivery.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;">Newstate Branding Co. - Proofing System</p>
            <p style="margin: 5px 0;">Project approval notification sent at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
Project Approved!

Great news! A client has approved their project.

Client Name: ${data.clientName}
${data.clientEmail ? `Client Email: ${data.clientEmail}\n` : ''}
Project: ${data.projectName} (${data.projectNumber})
Approved At: ${data.approvedAt}

The client has officially approved this project and is satisfied with the final design.

View the approved project: ${adminReviewLink}

---
Newstate Branding Co. - Proofing System
Project approval notification sent at ${new Date().toLocaleString()}
    `.trim()

    // Add to email queue
    const result = await addToEmailQueue({
      to: adminEmail,
      subject: `🎉 Project Approved - ${data.projectName} (${data.projectNumber})`,
      htmlContent,
      textContent,
      from: fromEmail,
      priority: 1, // High priority for approval notifications
      metadata: {
        type: 'project_approval',
        projectName: data.projectName,
        projectNumber: data.projectNumber,
        clientName: data.clientName,
        clientEmail: data.clientEmail
      }
    })

    if (result.success) {
      console.log(`✅ Admin approval notification queued for project ${data.projectName}`)
      console.log(`📧 Email queued for: ${adminEmail}`)
      return { success: true, emailSentTo: adminEmail }
    } else {
      console.error('❌ Failed to queue admin approval notification:', result.error)
      return { success: false }
    }
  } catch (error) {
    console.error('❌ Error queuing admin approval notification:', error)
    return { success: false }
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = await getEmailTransporter()
    await transporter.verify()
    console.log('✅ Email configuration verified')
    return true
  } catch (error) {
    console.error('❌ Email configuration error:', error)
    return false
  }
}