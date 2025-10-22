import { prisma } from './db'

// Email configuration - using working IONOS credentials
const getEmailTransporter = async () => {
  // Import nodemailer dynamically
  const nodemailer = (await import('nodemailer')).default

  return nodemailer.createTransport({
    host: 'smtp.ionos.com',
    port: 465,
    secure: true,
    auth: {
      user: 'art@newstatebranding.com',
      pass: 'Suspect3*_*',
    },
  })
}

// Get admin email from settings
async function getAdminEmail(): Promise<string> {
  try {
    const settings = await prisma.settings.findFirst()
    return settings?.adminEmail || process.env.ADMIN_EMAIL || 'admin@newstatebranding.com'
  } catch (error) {
    console.error('Error fetching admin email:', error)
    return process.env.ADMIN_EMAIL || 'admin@newstatebranding.com'
  }
}

// Get sender email
function getSenderEmail(): string {
  return 'art@newstatebranding.com'
}

interface CommentNotificationData {
  clientName: string
  clientEmail?: string
  commentContent: string
  projectName: string
  projectNumber: string
  reviewLink: string
  designFileName: string
}

/**
 * Send email notification to admin when client sends a message
 */
export async function sendClientMessageNotificationToAdmin(
  data: CommentNotificationData
): Promise<boolean> {
  try {
    const transporter = await getEmailTransporter()
    const adminEmail = await getAdminEmail()
    const fromEmail = getSenderEmail()

    const mailOptions = {
      from: fromEmail,
      to: adminEmail,
      subject: `New Client Message - ${data.projectName} (${data.projectNumber})`,
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
              <h1 style="margin: 0; font-size: 24px;">📬 New Client Message</h1>
            </div>
            
            <div class="content">
              <p style="font-size: 16px; margin-top: 0;">You have received a new message from a client:</p>
              
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
                <a href="${data.reviewLink}" class="button">View Review & Reply</a>
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
New Client Message

Client Name: ${data.clientName}
${data.clientEmail ? `Client Email: ${data.clientEmail}\n` : ''}
Project: ${data.projectName} (${data.projectNumber})
Design File: ${data.designFileName}

Message:
${data.commentContent}

View and reply to this message: ${data.reviewLink}

---
Newstate Branding Co. - Proofing System
Notification sent at ${new Date().toLocaleString()}
      `.trim(),
    }

    await transporter.sendMail(mailOptions)
    console.log(`✅ Admin notification sent for client message from ${data.clientName}`)
    return true
  } catch (error) {
    console.error('❌ Error sending admin notification:', error)
    return false
  }
}

/**
 * Send email notification to client when admin replies
 */
export async function sendAdminReplyNotificationToClient(
  data: CommentNotificationData
): Promise<boolean> {
  try {
    if (!data.clientEmail) {
      console.log('⚠️ No client email provided, skipping notification')
      return false
    }

    const transporter = await getEmailTransporter()
    const fromEmail = getSenderEmail()

    const mailOptions = {
      from: fromEmail,
      to: data.clientEmail,
      subject: `New Reply on Your Project - ${data.projectName}`,
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
              <h1 style="margin: 0; font-size: 24px;">💬 New Reply from Your Design Team</h1>
            </div>
            
            <div class="content">
              <p style="font-size: 16px; margin-top: 0;">Hello ${data.clientName},</p>
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
                <a href="${data.reviewLink}" class="button">View Review & Continue Conversation</a>
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
New Reply from Your Design Team

Hello ${data.clientName},

Your design team has replied to your message regarding your project.

Project: ${data.projectName} (${data.projectNumber})
Design File: ${data.designFileName}

Reply:
${data.commentContent}

View the full conversation: ${data.reviewLink}

---
Newstate Branding Co. - Proofing System
Sent at ${new Date().toLocaleString()}
      `.trim(),
    }

    await transporter.sendMail(mailOptions)
    console.log(`✅ Client notification sent to ${data.clientEmail}`)
    return true
  } catch (error) {
    console.error('❌ Error sending client notification:', error)
    return false
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

