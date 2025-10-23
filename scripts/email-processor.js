#!/usr/bin/env node

/**
 * Background Email Processor
 * 
 * This script runs continuously to process emails from the queue.
 * It should be run as a background service or cron job.
 * 
 * Usage:
 *   node scripts/email-processor.js
 *   npm run email:processor
 */

const { PrismaClient } = require('@prisma/client')
const nodemailer = require('nodemailer')

const prisma = new PrismaClient()

// Configuration
const CONFIG = {
  batchSize: 10,
  retryDelayMinutes: 5,
  maxRetries: 3,
  cleanupIntervalHours: 24,
  processIntervalMs: 30000, // 30 seconds
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
  const tenMinutesAgo = new Date()
  tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - CONFIG.stuckEmailTimeoutMinutes)

  const result = await prisma.emailQueue.updateMany({
    where: {
      status: 'PROCESSING',
      lastAttempt: {
        lt: tenMinutesAgo
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

// Clean up old sent emails
async function cleanupOldEmails() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const result = await prisma.emailQueue.deleteMany({
    where: {
      status: 'SENT',
      sentAt: {
        lt: thirtyDaysAgo
      }
    }
  })

  if (result.count > 0) {
    console.log(`🧹 Cleaned up ${result.count} old emails`)
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

// Process batch of emails
async function processBatch() {
  try {
    console.log('📧 Starting email batch processing...')
    
    // Reset stuck emails first
    await resetStuckEmails()
    
    // Get emails to process
    const emails = await getEmailsToProcess()
    console.log(`📧 Found ${emails.length} emails to process`)
    
    if (emails.length === 0) {
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
    
    console.log(`📧 Batch processing complete: ${successful}/${processed} successful`)
    
    return { processed, successful, failed }
    
  } catch (error) {
    console.error('❌ Error in batch processing:', error)
    return { processed: 0, successful: 0, failed: 0 }
  }
}

// Main processor loop
async function startProcessor() {
  console.log('📧 Starting email processor...')
  console.log(`📧 Configuration: batchSize=${CONFIG.batchSize}, interval=${CONFIG.processIntervalMs}ms`)
  
  let lastCleanup = new Date()
  let isRunning = true
  
  const processLoop = async () => {
    while (isRunning) {
      try {
        const results = await processBatch()
        
        if (results.processed === 0) {
          // No emails to process, wait longer
          await new Promise(resolve => setTimeout(resolve, CONFIG.processIntervalMs))
        } else {
          // Processed some emails, wait a bit before next batch
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
        
        // Cleanup old emails periodically
        const now = new Date()
        const hoursSinceLastCleanup = (now.getTime() - lastCleanup.getTime()) / (1000 * 60 * 60)
        
        if (hoursSinceLastCleanup >= CONFIG.cleanupIntervalHours) {
          console.log('🧹 Running email cleanup...')
          await cleanupOldEmails()
          lastCleanup = now
        }
        
      } catch (error) {
        console.error('❌ Error in processor loop:', error)
        // Wait longer on error
        await new Promise(resolve => setTimeout(resolve, 60000))
      }
    }
  }
  
  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('📧 Shutting down email processor...')
    isRunning = false
    await prisma.$disconnect()
    process.exit(0)
  }
  
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  process.on('SIGUSR2', shutdown) // For nodemon
  
  // Start processing
  await processLoop()
}

// Start the processor
if (require.main === module) {
  startProcessor().catch(error => {
    console.error('❌ Fatal error in email processor:', error)
    process.exit(1)
  })
}

module.exports = {
  processEmail,
  processBatch,
  startProcessor
}
