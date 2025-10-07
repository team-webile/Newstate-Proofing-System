import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection by performing a simple query
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json(
      {
        success: true,
        message: 'Connection successful',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database connection error:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

