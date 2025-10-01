const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = createServer(app);
const port = 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Express routes
app.get('/', (req, res) => {
  res.json({
    message: 'Client Proofing System Socket Server',
    status: 'running',
    port: port,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Socket.IO CORS configuration
const allowedOrigins = [
  '*',
];


// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Join project room
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    console.log(`🔗 Socket ${socket.id} joined project room: project-${projectId}`);
  });

  // Leave project room
  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
    console.log(`Socket ${socket.id} left project ${projectId}`);
  });

  // Annotation events
  socket.on('addAnnotation', (data) => {
    console.log('Annotation added:', data);
    // Broadcast to all clients in the project room
    socket.to(`project-${data.projectId}`).emit('annotationAdded', {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      resolved: false
    });
  });

  socket.on('resolveAnnotation', (data) => {
    console.log('Annotation resolved:', data);
    // Broadcast to all clients in the project room
    socket.to(`project-${data.projectId}`).emit('annotationResolved', {
      annotationId: data.annotationId,
      resolvedBy: data.resolvedBy,
      timestamp: new Date().toISOString()
    });
  });

  // Comment events
  socket.on('addComment', (data) => {
    console.log('Comment added:', data);
    // Broadcast to all clients in the project room
    socket.to(`project-${data.projectId}`).emit('commentAdded', {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    });
  });

  // Annotation reply events
  socket.on('addAnnotationReply', (data) => {
    console.log('💬 Received addAnnotationReply event:', data);
    console.log('Broadcasting to project room:', `project-${data.projectId}`);

    // Handle both old and new data structures
    const replyContent = typeof data.reply === 'string' ? data.reply : data.reply.content;
    const replyId = typeof data.reply === 'object' && data.reply.id ? data.reply.id : Date.now().toString();
    const replyCreatedAt = typeof data.reply === 'object' && data.reply.createdAt ? data.reply.createdAt : data.timestamp;

    console.log('🔍 Processing reply data:', {
      replyType: typeof data.reply,
      replyContent,
      replyId,
      replyCreatedAt
    });

    // Broadcast to all clients in the project room
    const broadcastData = {
      projectId: data.projectId,
      annotationId: data.annotationId,
      reply: {
        id: replyId,
        content: replyContent,
        addedBy: data.addedBy,
        addedByName: data.addedByName,
        createdAt: replyCreatedAt
      },
      timestamp: data.timestamp
    };

    console.log('📡 Broadcasting annotationReplyAdded:', broadcastData);
    socket.to(`project-${data.projectId}`).emit('annotationReplyAdded', broadcastData);
    console.log('✅ Broadcasted annotationReplyAdded event');
  });

  // Annotation status change events
  socket.on('annotationStatusChanged', (data) => {
    console.log('Annotation status changed:', data);
    // Broadcast to all clients in the project room
    socket.to(`project-${data.projectId}`).emit('annotationStatusUpdated', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Handle annotation status updates from API
  socket.on('annotationStatusUpdated', (data) => {
    console.log('Broadcasting annotation status update:', data);
    // Broadcast to all clients in the project room
    socket.to(`project-${data.projectId}`).emit('annotationStatusUpdated', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Annotation assignment events
  socket.on('annotationAssigned', (data) => {
    console.log('Annotation assigned:', data);
    // Broadcast to all clients in the project room
    socket.to(`project-${data.projectId}`).emit('annotationAssigned', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Status update events
  socket.on('updateElementStatus', (data) => {
    console.log('Element status updated:', data);
    // Broadcast to all clients in the project room
    socket.to(`project-${data.projectId}`).emit('statusChanged', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Typing indicator events
  socket.on('typing', (data) => {
    console.log('Typing indicator:', data);
    // Broadcast to all other clients in the project room
    socket.to(`project-${data.projectId}`).emit('typing', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Dummy success message events
  socket.on('dummySuccessMessage', (data) => {
    console.log('💬 Dummy success message:', data);
    // Broadcast to all clients in the project room (including sender)
    io.to(`project-${data.projectId}`).emit('dummySuccessMessage', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Review status update events
  socket.on('reviewStatusChanged', (data) => {
    console.log('📊 Review status changed:', data);
    // Broadcast to all clients in the project room
    io.to(`project-${data.projectId}`).emit('reviewStatusChanged', {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    });
    
    // Also emit the old event for backward compatibility
    io.to(`project-${data.projectId}`).emit('reviewStatusUpdated', {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    });
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make socket server globally available
global.socketServer = io;

// Start server
server.listen(port, () => {
  console.log(`🚀 Socket Server running on http://localhost:${port}`);
  console.log(`🔌 Socket.IO server running on the same port`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`📡 Socket URL: ${process.env.NEXT_PUBLIC_SOCKET_URL || 'Not configured'}`);
  console.log(`🌐 App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
 