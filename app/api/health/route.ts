import { NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function GET() {
  try {
    const isConnected = await checkDatabaseConnection()
    
    if (isConnected) {
      return NextResponse.json({ 
        status: 'healthy', 
        database: 'connected',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({ 
        status: 'unhealthy', 
        database: 'disconnected',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
