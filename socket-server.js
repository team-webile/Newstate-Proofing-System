const { Server } = require('socket.io');
const http = require('http');

// Create HTTP server
const server = http.createServer();

// Get allowed origins from environment variable or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      "http://localhost:3000",
      "https://devnstage.xyz",
      "https://www.devnstage.xyz",
      "https://review.newstatebranding.com",
      "https://www.review.newstatebranding.com",
      "https://vps.newstatebranding.com"
    ];

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

  // Join review room when client connects
  socket.on('join-review', (reviewId) => {
    socket.join(`review-${reviewId}`);
    console.log(`Client ${socket.id} joined review room: ${reviewId}`);
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
