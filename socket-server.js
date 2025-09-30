require('dotenv').config({ path: '.env.local' });
const { createServer } = require('http');
const { Server } = require('socket.io');

const SOCKET_PORT = process.env.SOCKET_PORT || 3001;
const dev = process.env.NODE_ENV !== 'production';

// Create HTTP server for Socket.IO only
const server = createServer();

// CORS allowed origins
const allowedOrigins = [
  'http://localhost:3000', // Next.js app
];

// Add environment-specific origins
if (process.env.NEXT_PUBLIC_APP_URL) {
  allowedOrigins.push(process.env.NEXT_PUBLIC_APP_URL);
}
if (process.env.NEXT_PUBLIC_BASE_URL) {
  allowedOrigins.push(process.env.NEXT_PUBLIC_BASE_URL);
}

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
    socket.to(`project-${data.projectId}`).emit('annotationAdded', {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      resolved: false
    });
  });

  socket.on('resolveAnnotation', (data) => {
    console.log('Annotation resolved:', data);
    socket.to(`project-${data.projectId}`).emit('annotationResolved', {
      annotationId: data.annotationId,
      resolvedBy: data.resolvedBy,
      timestamp: new Date().toISOString()
    });
  });

  // Comment events
  socket.on('addComment', (data) => {
    console.log('Comment added:', data);
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
    
    const replyContent = typeof data.reply === 'string' ? data.reply : data.reply.content;
    const replyId = typeof data.reply === 'object' && data.reply.id ? data.reply.id : Date.now().toString();
    const replyCreatedAt = typeof data.reply === 'object' && data.reply.createdAt ? data.reply.createdAt : data.timestamp;
    
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
    socket.to(`project-${data.projectId}`).emit('annotationStatusUpdated', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('annotationStatusUpdated', (data) => {
    console.log('Broadcasting annotation status update:', data);
    socket.to(`project-${data.projectId}`).emit('annotationStatusUpdated', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Annotation assignment events
  socket.on('annotationAssigned', (data) => {
    console.log('Annotation assigned:', data);
    socket.to(`project-${data.projectId}`).emit('annotationAssigned', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Status update events
  socket.on('updateElementStatus', (data) => {
    console.log('Element status updated:', data);
    socket.to(`project-${data.projectId}`).emit('statusChanged', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Typing indicator events
  socket.on('typing', (data) => {
    console.log('Typing indicator:', data);
    socket.to(`project-${data.projectId}`).emit('typing', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Dummy success message events
  socket.on('dummySuccessMessage', (data) => {
    console.log('💬 Dummy success message:', data);
    io.to(`project-${data.projectId}`).emit('dummySuccessMessage', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Review status update events
  socket.on('reviewStatusChanged', (data) => {
    console.log('📊 Review status changed:', data);
    io.to(`project-${data.projectId}`).emit('reviewStatusUpdated', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start Socket.IO server
server.listen(SOCKET_PORT, () => {
  console.log('🚀 ======================================');
  console.log(`🔌 Socket.IO Server running on port ${SOCKET_PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log('🚀 ======================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing Socket.IO server');
  io.close(() => {
    console.log('Socket.IO server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing Socket.IO server');
  io.close(() => {
    console.log('Socket.IO server closed');
    process.exit(0);
  });
});
