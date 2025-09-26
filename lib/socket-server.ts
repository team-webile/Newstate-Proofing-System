import { Server as SocketIOServer } from 'socket.io'
import { Socket } from 'socket.io'

// Global Socket.io instance
let io: SocketIOServer | null = null

export function getSocketServer(): SocketIOServer | null {
  return io
}

export function initializeSocketServer() {
  if (!io) {
    console.log('🔌 Initializing Socket.io server...')
    
    // Create Socket.io server
    io = new SocketIOServer({
      path: '/api/socketio',
      cors: {
        origin: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    })

    // Socket.IO event handlers
    io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id)

      // Join project room
      socket.on('join-project', (projectId: string) => {
        socket.join(`project-${projectId}`)
        console.log(`🔗 Socket ${socket.id} joined project room: project-${projectId}`)
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

      // Annotation reply events
      socket.on('addAnnotationReply', (data) => {
        console.log('💬 Received addAnnotationReply event:', data)
        console.log('Broadcasting to project room:', `project-${data.projectId}`)
        // Broadcast to all clients in the project room
        socket.to(`project-${data.projectId}`).emit('annotationReplyAdded', {
          ...data,
          id: Date.now().toString(),
          timestamp: new Date().toISOString()
        })
        console.log('✅ Broadcasted annotationReplyAdded event')
      })

      // Annotation status change events
      socket.on('annotationStatusChanged', (data) => {
        console.log('Annotation status changed:', data)
        // Broadcast to all clients in the project room
        socket.to(`project-${data.projectId}`).emit('annotationStatusUpdated', {
          ...data,
          timestamp: new Date().toISOString()
        })
      })

      // Handle annotation status updates from API
      socket.on('annotationStatusUpdated', (data) => {
        console.log('Broadcasting annotation status update:', data)
        // Broadcast to all clients in the project room
        socket.to(`project-${data.projectId}`).emit('annotationStatusUpdated', {
          ...data,
          timestamp: new Date().toISOString()
        })
      })

      // Annotation assignment events
      socket.on('annotationAssigned', (data) => {
        console.log('Annotation assigned:', data)
        // Broadcast to all clients in the project room
        socket.to(`project-${data.projectId}`).emit('annotationAssigned', {
          ...data,
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

      // Typing indicator events
      socket.on('typing', (data) => {
        console.log('Typing indicator:', data)
        // Broadcast to all other clients in the project room
        socket.to(`project-${data.projectId}`).emit('typing', {
          ...data,
          timestamp: new Date().toISOString()
        })
      })

      // Disconnect handler
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })

    console.log('✅ Socket.io server initialized successfully')
  }
  
  return io
}
