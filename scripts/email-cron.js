#!/usr/bin/env node

/**
 * Email Queue Cron Job
 * 
 * This script processes emails from the queue and can be run as a cron job.
 * It's designed to be run every minute or so to process pending emails.
 * 
 * Usage:
 *   node scripts/email-cron.js
 *   # Add to crontab: * * * * * cd /path/to/project && node scripts/email-cron.js
 */

const { PrismaClient } = require('@prisma/client')
const nodemailer = require('nodemailer')

const prisma = new PrismaClient()

// Configuration
const CONFIG = {
  batchSize: 10,
  retryDelayMinutes: 5,
  maxRetries: 3,
  stuckEmailTimeoutMinutes: 10
}

// Email configuration
const getEmailTransporter = async () => {
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.ionos.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
      user: process.env.SMTP_USER || 'art@newstatebranding.com',
      pass: process.env.SMTP_PASS || 'Suspect3*_*',
    },
  }

  return nodemailer.createTransport(smtpConfig)
}

// Process a single email
async function processEmail(email) {
  try {
    console.log(`📧 Processing email ID: ${email.id}`)
    
    // Mark as processing
    await prisma.emailQueue.update({
      where: { id: email.id },
      data: {
        status: 'PROCESSING',
        lastAttempt: new Date()
      }
    })
    
    // Get email transporter
    const transporter = await getEmailTransporter()
    
    // Prepare mail options
    const mailOptions = {
      from: email.from,
      to: email.to,
      subject: email.subject,
      html: email.htmlContent,
      text: email.textContent || undefined
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)
    
    // Mark as sent
    await prisma.emailQueue.update({
      where: { id: email.id },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    })
    
    console.log(`✅ Email sent successfully: ${info.messageId}`)
    return { success: true }
    
  } catch (error) {
    console.error(`❌ Error processing email ${email.id}:`, error)
    
    // Mark as failed and schedule retry
    const nextAttempt = new Date()
    nextAttempt.setMinutes(nextAttempt.getMinutes() + CONFIG.retryDelayMinutes)
    
    await prisma.emailQueue.update({
      where: { id: email.id },
      data: {
        status: 'FAILED',
        attempts: email.attempts + 1,
        errorMessage: error.message,
        nextAttempt,
        lastAttempt: new Date()
      }
    })
    
    return { success: false, error: error.message }
  }
}

// Reset stuck emails
async function resetStuckEmails() {
  const timeoutMinutes = CONFIG.stuckEmailTimeoutMinutes
  const timeoutDate = new Date()
  timeoutDate.setMinutes(timeoutDate.getMinutes() - timeoutMinutes)

  const result = await prisma.emailQueue.updateMany({
    where: {
      status: 'PROCESSING',
      lastAttempt: {
        lt: timeoutDate
      }
    },
    data: {
      status: 'PENDING',
      nextAttempt: new Date()
    }
  })

  if (result.count > 0) {
    console.log(`🔄 Reset ${result.count} stuck emails`)
  }

  return result.count
}

// Get emails to process
async function getEmailsToProcess() {
  const now = new Date()
  
  const emails = await prisma.emailQueue.findMany({
    where: {
      status: {
        in: ['PENDING', 'FAILED']
      },
      nextAttempt: {
        lte: now
      },
      attempts: {
        lt: prisma.emailQueue.fields.maxAttempts
      }
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' }
    ],
    take: CONFIG.batchSize
  })

  return emails
}

// Main processing function
async function processEmails() {
  try {
    console.log('📧 Starting email cron job...')
    
    // Reset stuck emails first
    await resetStuckEmails()
    
    // Get emails to process
    const emails = await getEmailsToProcess()
    console.log(`📧 Found ${emails.length} emails to process`)
    
    if (emails.length === 0) {
      console.log('📧 No emails to process')
      return { processed: 0, successful: 0, failed: 0 }
    }

    let processed = 0
    let successful = 0
    let failed = 0

    // Process each email
    for (const email of emails) {
      processed++
      
      const result = await processEmail(email)
      
      if (result.success) {
        successful++
      } else {
        failed++
      }
      
      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`📧 Cron job complete: ${successful}/${processed} successful`)
    
    return { processed, successful, failed }
    
  } catch (error) {
    console.error('❌ Error in email cron job:', error)
    return { processed: 0, successful: 0, failed: 0 }
  }
}

// Run the cron job
if (require.main === module) {
  processEmails()
    .then(results => {
      console.log('📧 Cron job finished:', results)
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Fatal error in email cron job:', error)
      process.exit(1)
    })
    .finally(() => {
      prisma.$disconnect()
    })
}

module.exports = {
  processEmails,
  processEmail
}
