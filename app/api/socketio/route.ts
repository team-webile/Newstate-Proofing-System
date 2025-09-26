import { NextRequest } from 'next/server'
import { initializeSocketServer } from '@/lib/socket-server'

export async function GET(req: NextRequest) {
  // Initialize Socket.io server
  const io = initializeSocketServer()
  
  if (io) {
    return new Response('Socket.IO server running', { status: 200 })
  } else {
    return new Response('Socket.IO server failed to initialize', { status: 500 })
  }
}