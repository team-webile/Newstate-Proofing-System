/**
 * Socket.IO Integration Guide for Client Proofing System
 * 
 * This file provides the structure and documentation for implementing
 * real-time features using Socket.IO in production.
 * 
 * INSTALLATION:
 * npm install socket.io socket.io-client
 * 
 * SERVER SETUP (create server.ts or add to your Next.js custom server):
 * 
 * import { createServer } from 'http'
 * import { Server } from 'socket.io'
 * import next from 'next'
 * 
 * const dev = process.env.NODE_ENV !== 'production'
 * const app = next({ dev })
 * const handle = app.getRequestHandler()
 * 
 * app.prepare().then(() => {
 *   const httpServer = createServer((req, res) => {
 *     handle(req, res)
 *   })
 * 
 *   const io = new Server(httpServer, {
 *     cors: {
 *       origin: process.env.CLIENT_URL || 'http://localhost:3000',
 *       methods: ['GET', 'POST']
 *     }
 *   })
 * 
 *   // Socket.IO event handlers
 *   io.on('connection', (socket) => {
 *     console.log('Client connected:', socket.id)
 * 
 *     // Join project room
 *     socket.on('join_project', (projectId) => {
 *       socket.join(`project_${projectId}`)
 *       console.log(`Socket ${socket.id} joined project_${projectId}`)
 *     })
 * 
 *     // Join review room
 *     socket.on('join_review', (reviewId) => {
 *       socket.join(`review_${reviewId}`)
 *       console.log(`Socket ${socket.id} joined review_${reviewId}`)
 *     })
 * 
 *     // Handle disconnection
 *     socket.on('disconnect', () => {
 *       console.log('Client disconnected:', socket.id)
 *     })
 *   })
 * 
 *   httpServer.listen(3000, () => {
 *     console.log('> Ready on http://localhost:3000')
 *   })
 * })
 * 
 * EVENTS TO EMIT FROM SERVER:
 */

// Type definitions for Socket.IO events
export interface ServerToClientEvents {
  // Annotation events
  annotation_added: (data: {
    fileId: number
    annotation: any
  }) => void

  annotation_updated: (data: {
    annotationId: number
    status: string
  }) => void

  annotation_deleted: (data: {
    annotationId: number
  }) => void

  reply_added: (data: {
    annotationId: number
    reply: any
  }) => void

  // Status events
  status_updated: (data: {
    reviewId: number
    status: string
  }) => void

  // Review events
  review_created: (data: {
    projectId: number
    review: any
  }) => void

  // Approval events
  approval_received: (data: {
    reviewId: number
    approval: any
  }) => void

  // Activity events
  activity_logged: (data: {
    projectId: number
    activity: any
  }) => void
}

export interface ClientToServerEvents {
  join_project: (projectId: number) => void
  join_review: (reviewId: number) => void
  leave_project: (projectId: number) => void
  leave_review: (reviewId: number) => void
}

/**
 * CLIENT SETUP (useSocket.ts hook):
 * 
 * 'use client'
 * 
 * import { useEffect, useState } from 'react'
 * import { io, Socket } from 'socket.io-client'
 * 
 * export function useSocket() {
 *   const [socket, setSocket] = useState<Socket | null>(null)
 *   const [isConnected, setIsConnected] = useState(false)
 * 
 *   useEffect(() => {
 *     const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
 *       transports: ['websocket', 'polling'],
 *     })
 * 
 *     socketInstance.on('connect', () => {
 *       console.log('Socket connected')
 *       setIsConnected(true)
 *     })
 * 
 *     socketInstance.on('disconnect', () => {
 *       console.log('Socket disconnected')
 *       setIsConnected(false)
 *     })
 * 
 *     setSocket(socketInstance)
 * 
 *     return () => {
 *       socketInstance.disconnect()
 *     }
 *   }, [])
 * 
 *   return { socket, isConnected }
 * }
 * 
 * USAGE IN COMPONENTS:
 * 
 * const { socket, isConnected } = useSocket()
 * 
 * useEffect(() => {
 *   if (!socket || !isConnected) return
 * 
 *   // Join project room
 *   socket.emit('join_project', projectId)
 * 
 *   // Listen for status updates
 *   socket.on('status_updated', (data) => {
 *     console.log('Status updated:', data)
 *     // Update your UI here
 *   })
 * 
 *   // Listen for new annotations
 *   socket.on('annotation_added', (data) => {
 *     console.log('Annotation added:', data)
 *     // Update your UI here
 *   })
 * 
 *   return () => {
 *     socket.off('status_updated')
 *     socket.off('annotation_added')
 *   }
 * }, [socket, isConnected, projectId])
 * 
 * NGINX CONFIGURATION FOR WEBSOCKETS:
 * 
 * location /socket.io/ {
 *   proxy_pass http://localhost:3000;
 *   proxy_http_version 1.1;
 *   proxy_set_header Upgrade $http_upgrade;
 *   proxy_set_header Connection "upgrade";
 *   proxy_set_header Host $host;
 *   proxy_cache_bypass $http_upgrade;
 * }
 * 
 * PM2 CONFIGURATION (ecosystem.config.js):
 * 
 * module.exports = {
 *   apps: [
 *     {
 *       name: 'client-proofing',
 *       script: 'server.ts',
 *       instances: 1,
 *       exec_mode: 'cluster',
 *       env: {
 *         NODE_ENV: 'production',
 *         PORT: 3000
 *       }
 *     }
 *   ]
 * }
 */

// Placeholder function for emitting events in API routes
export function emitSocketEvent(event: string, data: any) {
  console.log(`[Socket Placeholder] Would emit: ${event}`, data)
  // In production with Socket.IO:
  // io.to(room).emit(event, data)
}

// Placeholder for getting socket instance
export function getSocketIO() {
  console.warn("Socket.IO not initialized. See lib/socket.ts for setup instructions.")
  return null
}

export default {
  emitSocketEvent,
  getSocketIO,
}

