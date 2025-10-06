const { Server } = require('socket.io');
const http = require('http');

// Create HTTP server
const server = http.createServer();

// Create Socket.IO server on port 3001
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
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

// Start server on port 3001
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

module.exports = { io };
