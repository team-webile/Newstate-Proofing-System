import { prisma } from './db'
import { EmailStatus } from '@prisma/client'

export interface EmailQueueItem {
  to: string
  subject: string
  htmlContent: string
  textContent?: string
  from?: string
  priority?: number
  metadata?: any
  maxAttempts?: number
  delayUntil?: Date
}

export interface EmailQueueStats {
  pending: number
  processing: number
  sent: number
  failed: number
  total: number
}

/**
 * Add an email to the queue
 */
export async function addToEmailQueue(item: EmailQueueItem): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    const emailQueue = await prisma.emailQueue.create({
      data: {
        to: item.to,
        subject: item.subject,
        htmlContent: item.htmlContent,
        textContent: item.textContent,
        from: item.from || 'art@newstatebranding.com',
        priority: item.priority || 0,
        maxAttempts: item.maxAttempts || 3,
        metadata: item.metadata,
        nextAttempt: item.delayUntil || new Date(),
        status: EmailStatus.PENDING
      }
    })

    console.log(`📧 Email queued with ID: ${emailQueue.id}`)
    return { success: true, id: emailQueue.id }
  } catch (error) {
    console.error('❌ Error adding email to queue:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get emails ready to be processed
 */
export async function getEmailsToProcess(limit: number = 10): Promise<any[]> {
  try {
    const now = new Date()
    
    const emails = await prisma.emailQueue.findMany({
      where: {
        status: {
          in: [EmailStatus.PENDING, EmailStatus.FAILED]
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
      take: limit
    })

    return emails
  } catch (error) {
    console.error('❌ Error getting emails to process:', error)
    return []
  }
}

/**
 * Mark email as processing
 */
export async function markEmailAsProcessing(id: number): Promise<boolean> {
  try {
    await prisma.emailQueue.update({
      where: { id },
      data: {
        status: EmailStatus.PROCESSING,
        lastAttempt: new Date()
      }
    })
    return true
  } catch (error) {
    console.error('❌ Error marking email as processing:', error)
    return false
  }
}

/**
 * Mark email as sent
 */
export async function markEmailAsSent(id: number): Promise<boolean> {
  try {
    await prisma.emailQueue.update({
      where: { id },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date()
      }
    })
    return true
  } catch (error) {
    console.error('❌ Error marking email as sent:', error)
    return false
  }
}

/**
 * Mark email as failed and schedule retry
 */
export async function markEmailAsFailed(id: number, errorMessage: string, retryDelayMinutes: number = 5): Promise<boolean> {
  try {
    const email = await prisma.emailQueue.findUnique({
      where: { id }
    })

    if (!email) return false

    const nextAttempt = new Date()
    nextAttempt.setMinutes(nextAttempt.getMinutes() + retryDelayMinutes)

    await prisma.emailQueue.update({
      where: { id },
      data: {
        status: EmailStatus.FAILED,
        attempts: email.attempts + 1,
        errorMessage,
        nextAttempt,
        lastAttempt: new Date()
      }
    })
    return true
  } catch (error) {
    console.error('❌ Error marking email as failed:', error)
    return false
  }
}

/**
 * Get email queue statistics
 */
export async function getEmailQueueStats(): Promise<EmailQueueStats> {
  try {
    const stats = await prisma.emailQueue.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const result: EmailQueueStats = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      total: 0
    }

    stats.forEach(stat => {
      const count = stat._count.id
      result.total += count

      switch (stat.status) {
        case EmailStatus.PENDING:
          result.pending = count
          break
        case EmailStatus.PROCESSING:
          result.processing = count
          break
        case EmailStatus.SENT:
          result.sent = count
          break
        case EmailStatus.FAILED:
          result.failed = count
          break
      }
    })

    return result
  } catch (error) {
    console.error('❌ Error getting email queue stats:', error)
    return {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      total: 0
    }
  }
}

/**
 * Clean up old sent emails (older than 30 days)
 */
export async function cleanupOldEmails(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = await prisma.emailQueue.deleteMany({
      where: {
        status: EmailStatus.SENT,
        sentAt: {
          lt: thirtyDaysAgo
        }
      }
    })

    console.log(`🧹 Cleaned up ${result.count} old emails`)
    return result.count
  } catch (error) {
    console.error('❌ Error cleaning up old emails:', error)
    return 0
  }
}

/**
 * Cancel pending emails by criteria
 */
export async function cancelEmails(criteria: {
  to?: string
  subject?: string
  metadata?: any
}): Promise<number> {
  try {
    const result = await prisma.emailQueue.updateMany({
      where: {
        status: EmailStatus.PENDING,
        ...criteria
      },
      data: {
        status: EmailStatus.CANCELLED
      }
    })

    console.log(`🚫 Cancelled ${result.count} emails`)
    return result.count
  } catch (error) {
    console.error('❌ Error cancelling emails:', error)
    return 0
  }
}

/**
 * Get failed emails for retry
 */
export async function getFailedEmails(limit: number = 50): Promise<any[]> {
  try {
    const emails = await prisma.emailQueue.findMany({
      where: {
        status: EmailStatus.FAILED,
        attempts: {
          lt: prisma.emailQueue.fields.maxAttempts
        }
      },
      orderBy: { lastAttempt: 'asc' },
      take: limit
    })

    return emails
  } catch (error) {
    console.error('❌ Error getting failed emails:', error)
    return []
  }
}

/**
 * Reset stuck processing emails (older than 10 minutes)
 */
export async function resetStuckEmails(): Promise<number> {
  try {
    const tenMinutesAgo = new Date()
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10)

    const result = await prisma.emailQueue.updateMany({
      where: {
        status: EmailStatus.PROCESSING,
        lastAttempt: {
          lt: tenMinutesAgo
        }
      },
      data: {
        status: EmailStatus.PENDING,
        nextAttempt: new Date()
      }
    })

    console.log(`🔄 Reset ${result.count} stuck emails`)
    return result.count
  } catch (error) {
    console.error('❌ Error resetting stuck emails:', error)
    return 0
  }
}
