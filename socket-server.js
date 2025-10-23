const { Server } = require('socket.io');
const http = require('http');

// Create HTTP server
const server = http.createServer();

// Get allowed origins from environment variable or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ["http://localhost:3000", "https://devnstage.xyz", "https://www.devnstage.xyz", "https://preview.devnstage.xyz"];

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store connected clients
const connectedClients = new Map();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  console.log(`Client origin: ${socket.handshake.headers.origin}`);
  console.log(`Client user-agent: ${socket.handshake.headers['user-agent']}`);

  // Join review room when client connects
  socket.on('join-review', (reviewId) => {
    socket.join(`review-${reviewId}`);
    console.log(`Client ${socket.id} joined review room: ${reviewId}`);
  });

  // Join project room for email updates
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    console.log(`Client ${socket.id} joined project room: ${projectId}`);
  });

  // Leave project room
  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
    console.log(`Client ${socket.id} left project room: ${projectId}`);
  });

  // Handle new comment
  socket.on('new-comment', (data) => {
    console.log('New comment received:', data);
    // Broadcast to all clients in the review room
    socket.to(`review-${data.reviewId}`).emit('comment-added', data);
  });

  // Handle status update (Approved/Revision Requested)
  socket.on('update-status', (data) => {
    console.log('Status update received:', data);
    // Broadcast status update to all clients in the review room
    socket.to(`review-${data.reviewId}`).emit('status-updated', data);
  });

  // Handle client email update
  socket.on('client-email-updated', (data) => {
    console.log('📧 Socket server received client-email-updated:', data);
    console.log('📧 Broadcasting to project room: project-' + data.projectId);
    
    // Validate data
    if (!data.projectId || !data.newEmail) {
      console.error('📧 Invalid email update data:', data);
      return;
    }
    
    // Broadcast to all clients in the project room
    const broadcastData = {
      projectId: data.projectId,
      newEmail: data.newEmail,
      oldEmail: data.oldEmail,
      updatedBy: data.updatedBy || 'Client'
    };
    
    // Get room info for debugging
    const room = `project-${data.projectId}`;
    const roomClients = io.sockets.adapter.rooms.get(room);
    console.log(`📧 Room ${room} has ${roomClients ? roomClients.size : 0} clients`);
    
    io.to(room).emit('clientEmailUpdated', broadcastData);
    console.log('📧 Socket server broadcasted clientEmailUpdated:', broadcastData);
  });

  // Handle admin email sent notification
  socket.on('admin-email-sent', (data) => {
    console.log('Admin email sent:', data);
    // Broadcast to all clients in the project room
    io.to(`project-${data.projectId}`).emit('adminEmailSent', {
      projectId: data.projectId,
      emailSentTo: data.emailSentTo,
      message: data.message || 'Email sent to updated client address'
    });
  });

  // Handle client activity updates (comments, annotations, etc.)
  socket.on('client-activity', (data) => {
    console.log('Client activity:', data);
    // Broadcast to all clients in the project room
    io.to(`project-${data.projectId}`).emit('clientActivity', {
      projectId: data.projectId,
      activityType: data.activityType,
      message: data.message,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    connectedClients.delete(socket.id);
  });
});

// Start server on specified port or default to 3001
const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});

module.exports = { io };
