import { NextRequest } from 'next/server'
import { SocketManager } from '@/lib/socket'

export async function GET(req: NextRequest) {
  return new Response('Socket.IO server is running', { status: 200 })
}

export async function POST(req: NextRequest) {
  return new Response('Socket.IO server is running', { status: 200 })
}
