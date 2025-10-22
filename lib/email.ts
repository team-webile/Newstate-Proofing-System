import { prisma } from './db'

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
    console.log('🔍 Searching for admin user in database...')
    
    // First try to get admin email from user table
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { email: true, firstName: true, lastName: true }
    })
    
    console.log('👤 Admin user query result:', adminUser)
    
    if (adminUser?.email) {
      console.log('✅ Admin email fetched from user table:', adminUser.email)
      return adminUser.email
    }
    
    console.log('⚠️ No admin user found, trying settings...')
    
    // Fallback to settings
    const settings = await prisma.settings.findFirst()
    console.log('⚙️ Settings query result:', settings)
    
    const settingsEmail = settings?.adminEmail || process.env.ADMIN_EMAIL || 'admin@newstatebranding.com'
    console.log('📧 Using admin email from settings:', settingsEmail)
    return settingsEmail
  } catch (error) {
    console.error('❌ Error fetching admin email from database:', error)
    // Final fallback
    const finalFallback = process.env.ADMIN_EMAIL || 'admin@newstatebranding.com'
    console.log('📧 Using final fallback admin email:', finalFallback)
    return finalFallback
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
    console.log('📧 Starting admin notification process...')
    const transporter = await getEmailTransporter()
    console.log('📧 Email transporter created')
    
    const adminEmail = await getAdminEmail()
    console.log('📧 Admin email retrieved:', adminEmail)
    
    const fromEmail = getSenderEmail()
    console.log('📧 From email:', fromEmail)

    // Create admin review link (for admin to view)
    const adminReviewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://review.newstatebranding.com'}/admin/review/${data.reviewLink.split('/review/')[1] || data.reviewLink}`
    
    const mailOptions = {
      from: fromEmail,
      to: adminEmail,
      subject: `Client ${data.commentType === 'annotation' ? 'Added Annotation' : 'Left Comment'} - ${data.projectName} (${data.projectNumber})`,
      html: `
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
      `,
      text: `
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
      `.trim(),
    }

    await transporter.sendMail(mailOptions)
    console.log(`✅ Admin notification sent for client message from ${data.clientName}`)
    console.log(`📧 Email sent to: ${adminEmail}`)
    return { success: true, emailSentTo: adminEmail }
  } catch (error) {
    console.error('❌ Error sending admin notification:', error)
    console.error('❌ Email configuration:', {
      host: 'smtp.ionos.com',
      port: 465,
      user: 'art@newstatebranding.com'
    })
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

    const transporter = await getEmailTransporter()
    const fromEmail = getSenderEmail()

    // Create client review link (for client to view)
    const clientReviewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://review.newstatebranding.com'}/review/${data.reviewLink.split('/review/')[1] || data.reviewLink}`
    
    const mailOptions = {
      from: fromEmail,
      to: data.clientEmail,
      subject: `Design Team Replied - ${data.projectName} (${data.projectNumber})`,
      html: `
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
      `,
      text: `
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
      `.trim(),
    }

    await transporter.sendMail(mailOptions)
    console.log(`✅ Client notification sent to ${data.clientEmail}`)
    return { success: true, emailSentTo: data.clientEmail }
  } catch (error) {
    console.error('❌ Error sending client notification:', error)
    console.error('❌ Email configuration:', {
      host: 'smtp.ionos.com',
      port: 465,
      user: 'art@newstatebranding.com'
    })
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