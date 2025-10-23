import { prisma } from './db'
import { 
  getEmailsToProcess, 
  markEmailAsProcessing, 
  markEmailAsSent, 
  markEmailAsFailed,
  resetStuckEmails,
  cleanupOldEmails
} from './email-queue'
import { EmailStatus } from '@prisma/client'

// Email configuration - using environment variables for better server compatibility
const getEmailTransporter = async () => {
  // Import nodemailer dynamically
  const nodemailer = await import('nodemailer')

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

  return nodemailer.createTransporter(smtpConfig)
}

export interface EmailProcessorConfig {
  batchSize: number
  retryDelayMinutes: number
  maxRetries: number
  cleanupIntervalHours: number
}

const defaultConfig: EmailProcessorConfig = {
  batchSize: 10,
  retryDelayMinutes: 5,
  maxRetries: 3,
  cleanupIntervalHours: 24
}

/**
 * Process a single email from the queue
 */
export async function processEmail(emailId: number): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 Processing email ID: ${emailId}`)
    
    // Mark as processing
    await markEmailAsProcessing(emailId)
    
    // Get email details
    const email = await prisma.emailQueue.findUnique({
      where: { id: emailId }
    })

    if (!email) {
      return { success: false, error: 'Email not found' }
    }

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
    await markEmailAsSent(emailId)
    
    console.log(`✅ Email sent successfully: ${info.messageId}`)
    return { success: true }
    
  } catch (error) {
    console.error(`❌ Error processing email ${emailId}:`, error)
    
    // Mark as failed and schedule retry
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await markEmailAsFailed(emailId, errorMessage, 5)
    
    return { 
      success: false, 
      error: errorMessage 
    }
  }
}

/**
 * Process a batch of emails
 */
export async function processEmailBatch(config: EmailProcessorConfig = defaultConfig): Promise<{
  processed: number
  successful: number
  failed: number
  errors: string[]
}> {
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [] as string[]
  }

  try {
    console.log('📧 Starting email batch processing...')
    
    // Reset stuck emails first
    const stuckCount = await resetStuckEmails()
    if (stuckCount > 0) {
      console.log(`🔄 Reset ${stuckCount} stuck emails`)
    }
    
    // Get emails to process
    const emails = await getEmailsToProcess(config.batchSize)
    console.log(`📧 Found ${emails.length} emails to process`)
    
    if (emails.length === 0) {
      return results
    }

    // Process each email
    for (const email of emails) {
      results.processed++
      
      const result = await processEmail(email.id)
      
      if (result.success) {
        results.successful++
      } else {
        results.failed++
        if (result.error) {
          results.errors.push(`Email ${email.id}: ${result.error}`)
        }
      }
      
      // Small delay between emails to avoid overwhelming SMTP server
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`📧 Batch processing complete: ${results.successful}/${results.processed} successful`)
    
  } catch (error) {
    console.error('❌ Error in batch processing:', error)
    results.errors.push(`Batch processing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return results
}

/**
 * Process emails continuously (for background worker)
 */
export async function startEmailProcessor(config: EmailProcessorConfig = defaultConfig): Promise<void> {
  console.log('📧 Starting email processor...')
  
  let isRunning = true
  let lastCleanup = new Date()
  
  const processLoop = async () => {
    while (isRunning) {
      try {
        // Process batch
        const results = await processEmailBatch(config)
        
        if (results.processed === 0) {
          // No emails to process, wait a bit
          await new Promise(resolve => setTimeout(resolve, 30000)) // 30 seconds
        } else {
          // Processed some emails, wait a bit before next batch
          await new Promise(resolve => setTimeout(resolve, 5000)) // 5 seconds
        }
        
        // Cleanup old emails periodically
        const now = new Date()
        const hoursSinceLastCleanup = (now.getTime() - lastCleanup.getTime()) / (1000 * 60 * 60)
        
        if (hoursSinceLastCleanup >= config.cleanupIntervalHours) {
          console.log('🧹 Running email cleanup...')
          await cleanupOldEmails()
          lastCleanup = now
        }
        
      } catch (error) {
        console.error('❌ Error in email processor loop:', error)
        // Wait longer on error
        await new Promise(resolve => setTimeout(resolve, 60000)) // 1 minute
      }
    }
  }
  
  // Handle graceful shutdown
  const shutdown = () => {
    console.log('📧 Shutting down email processor...')
    isRunning = false
  }
  
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  
  // Start processing
  await processLoop()
}

/**
 * Process emails immediately (for API endpoints)
 */
export async function processEmailsNow(config: EmailProcessorConfig = defaultConfig): Promise<{
  processed: number
  successful: number
  failed: number
  errors: string[]
}> {
  console.log('📧 Processing emails immediately...')
  return await processEmailBatch(config)
}

/**
 * Get processor health status
 */
export async function getProcessorHealth(): Promise<{
  healthy: boolean
  stats: any
  issues: string[]
}> {
  const issues: string[] = []
  
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check email configuration
    const transporter = await getEmailTransporter()
    await transporter.verify()
    
    // Get queue stats
    const stats = await prisma.emailQueue.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    // Check for stuck emails
    const stuckEmails = await prisma.emailQueue.count({
      where: {
        status: EmailStatus.PROCESSING,
        lastAttempt: {
          lt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
        }
      }
    })
    
    if (stuckEmails > 0) {
      issues.push(`${stuckEmails} emails stuck in processing state`)
    }
    
    // Check for too many failed emails
    const failedEmails = await prisma.emailQueue.count({
      where: {
        status: EmailStatus.FAILED
      }
    })
    
    if (failedEmails > 100) {
      issues.push(`${failedEmails} emails in failed state`)
    }
    
    return {
      healthy: issues.length === 0,
      stats,
      issues
    }
    
  } catch (error) {
    issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      healthy: false,
      stats: {},
      issues
    }
  }
}
