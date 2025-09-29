const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Create Socket.IO server
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? 'https://preview.devnstage.xyz'
        : 'http://localhost:3000',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
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

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Start server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Server running on http://${hostname}:${port}`);
    console.log(`🔌 Socket.IO server running on the same port`);
  });
});
