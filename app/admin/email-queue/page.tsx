'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import AdminLayout from '../components/AdminLayout'
import { Mail, RefreshCw, Trash2, Play, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface EmailQueueStats {
  pending: number
  processing: number
  sent: number
  failed: number
  total: number
}

export default function EmailQueuePage() {
  const [stats, setStats] = useState<EmailQueueStats>({
    pending: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    total: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const loadStats = async () => {
    try {
      const response = await fetch('/api/email-queue')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      } else {
        toast.error('Failed to load email queue stats')
      }
    } catch (error) {
      } finally {
      setIsLoading(false)
    }
  }

  const processEmails = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/email-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process', batchSize: 10 })
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(`Processed ${data.results.successful}/${data.results.processed} emails`)
        loadStats()
      } else {
        toast.error('Failed to process emails')
      }
    } catch (error) {
      toast.error('Error processing emails')
    } finally {
      setIsProcessing(false)
    }
  }

  const cleanupEmails = async () => {
    try {
      const response = await fetch('/api/email-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' })
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(`Cleaned up ${data.cleanedCount} old emails`)
        loadStats()
      } else {
        toast.error('Failed to cleanup emails')
      }
    } catch (error) {
      toast.error('Error cleaning up emails')
    }
  }

  useEffect(() => {
    loadStats()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'processing': return 'bg-blue-500'
      case 'sent': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'processing': return <RefreshCw className="h-4 w-4" />
      case 'sent': return <CheckCircle className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <AdminLayout title="Email Queue" description="Email queue management" icon={<Mail className="h-8 w-8 text-brand-yellow" />}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-yellow border-t-transparent mx-auto"></div>
            <p className="mt-4 text-xl text-gray-300">Loading Email Queue...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Email Queue" description="Manage email queue and processing" icon={<Mail className="h-8 w-8 text-brand-yellow" />}>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Email Queue Management</h1>
          <p className="text-neutral-400">Monitor and manage the email processing queue</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
              <p className="text-xs text-neutral-400">Emails waiting to be sent</p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Processing</CardTitle>
              <RefreshCw className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.processing}</div>
              <p className="text-xs text-neutral-400">Currently being sent</p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Sent</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.sent}</div>
              <p className="text-xs text-neutral-400">Successfully delivered</p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
              <p className="text-xs text-neutral-400">Failed to send</p>
            </CardContent>
          </Card>
        </div>

        {/* Queue Status */}
        <Card className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 transition-colors mb-8">
          <CardHeader>
            <CardTitle className="text-white text-xl">Queue Status</CardTitle>
            <CardDescription className="text-neutral-400">
              Current state of the email processing queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Total Emails</span>
                <Badge variant="outline" className="text-neutral-300 border-neutral-600">
                  {stats.total}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Pending</span>
                <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                  {stats.pending}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Processing</span>
                <Badge variant="outline" className="text-blue-500 border-blue-500">
                  {stats.processing}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Sent</span>
                <Badge variant="outline" className="text-green-500 border-green-500">
                  {stats.sent}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Failed</span>
                <Badge variant="outline" className="text-red-500 border-red-500">
                  {stats.failed}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 transition-colors">
          <CardHeader>
            <CardTitle className="text-white text-xl">Queue Actions</CardTitle>
            <CardDescription className="text-neutral-400">
              Manage and process emails in the queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={processEmails}
                disabled={isProcessing || stats.pending === 0}
                className="bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Process Emails
                  </>
                )}
                )}
              </Button>

              <Button
                onClick={loadStats}
                variant="outline"
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white bg-neutral-900"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Stats
              </Button>

              <Button
                onClick={cleanupEmails}
                variant="outline"
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white bg-neutral-900"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup Old Emails
              </Button>
            </div>

            <div className="mt-6 p-4 bg-neutral-800 rounded-lg">
              <h4 className="text-sm font-medium text-neutral-300 mb-2">Queue Information</h4>
              <ul className="text-sm text-neutral-400 space-y-1">
                <li>• Emails are processed automatically every 30 seconds</li>
                <li>• Failed emails are retried up to 3 times</li>
                <li>• Old sent emails are cleaned up after 30 days</li>
                <li>• High priority emails are processed first</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
