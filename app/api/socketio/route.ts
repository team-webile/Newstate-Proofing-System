import { NextRequest } from 'next/server'
import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Socket } from 'socket.io'

let io: SocketIOServer | null = null

export async function GET(req: NextRequest) {
  if (!io) {
    const httpServer = new NetServer()
    io = new SocketIOServer(httpServer, {
      path: '/api/socketio',
      cors: {
        origin: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    })

    // Socket.IO event handlers
    io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id)

      // Join project room
      socket.on('join-project', (projectId: string) => {
        socket.join(`project-${projectId}`)
        console.log(`Socket ${socket.id} joined project ${projectId}`)
      })

      // Leave project room
      socket.on('leave-project', (projectId: string) => {
        socket.leave(`project-${projectId}`)
        console.log(`Socket ${socket.id} left project ${projectId}`)
      })

      // Annotation events
      socket.on('addAnnotation', (data) => {
        console.log('Annotation added:', data)
        // Broadcast to all clients in the project room
        socket.to(`project-${data.projectId}`).emit('annotationAdded', {
          ...data,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          resolved: false
        })
      })

      socket.on('resolveAnnotation', (data) => {
        console.log('Annotation resolved:', data)
        // Broadcast to all clients in the project room
        socket.to(`project-${data.projectId}`).emit('annotationResolved', {
          annotationId: data.annotationId,
          resolvedBy: data.resolvedBy,
          timestamp: new Date().toISOString()
        })
      })

      // Comment events
      socket.on('addComment', (data) => {
        console.log('Comment added:', data)
        // Broadcast to all clients in the project room
        socket.to(`project-${data.projectId}`).emit('commentAdded', {
          ...data,
          id: Date.now().toString(),
          timestamp: new Date().toISOString()
        })
      })

      // Status update events
      socket.on('updateElementStatus', (data) => {
        console.log('Element status updated:', data)
        // Broadcast to all clients in the project room
        socket.to(`project-${data.projectId}`).emit('statusChanged', {
          ...data,
          timestamp: new Date().toISOString()
        })
      })

      // Disconnect handler
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }

  return new Response('Socket.IO server running', { status: 200 })
}