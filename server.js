const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ 
  dev, 
  hostname, 
  port,
  // Disable tracing to avoid permission issues
  experimental: {
    tracing: false
  }
})
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? "http://localhost:3000" : process.env.NEXT_PUBLIC_APP_URL,
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/api/socketio',
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  })

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join project room for real-time updates
    socket.on('join-project', (projectId) => {
      socket.join(`project-${projectId}`)
      console.log(`Client ${socket.id} joined project ${projectId}`)
    })

    // Join element room for element-specific updates
    socket.on('join-element', (elementId) => {
      socket.join(`element-${elementId}`)
      console.log(`Client ${socket.id} joined element ${elementId}`)
    })

    // Handle annotation additions
    socket.on('addAnnotation', (data) => {
      console.log('Annotation added:', data)
      // Broadcast to all clients in the project room
      socket.to(`project-${data.projectId}`).emit('annotationAdded', {
        fileId: data.fileId,
        annotation: data.annotation,
        timestamp: new Date().toISOString(),
        addedBy: data.addedBy || 'Admin',
        addedByName: data.addedByName || data.addedBy || 'Unknown'
      })
    })

    // Handle status changes
    socket.on('statusChanged', (data) => {
      console.log('Status changed:', data)
      // Broadcast to all clients in the project room
      socket.to(`project-${data.projectId}`).emit('statusChanged', {
        status: data.status,
        message: data.message,
        timestamp: new Date().toISOString()
      })
    })

    // Handle new comments
    socket.on('newComment', (data) => {
      console.log('New comment:', data)
      // Broadcast to all clients in the project room
      socket.to(`project-${data.projectId}`).emit('commentAdded', {
        elementId: data.elementId,
        comment: data.comment,
        timestamp: new Date().toISOString(),
        addedBy: data.addedBy || 'Admin'
      })
    })

    // Leave project room
    socket.on('leave-project', (projectId) => {
      socket.leave(`project-${projectId}`)
      console.log(`Client ${socket.id} left project ${projectId}`)
    })

    // Leave element room
    socket.on('leave-element', (elementId) => {
      socket.leave(`element-${elementId}`)
      console.log(`Client ${socket.id} left element ${elementId}`)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  // Make io available globally for API routes
  global.io = io

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Socket.IO server running on port ${port}`)
    })
})
