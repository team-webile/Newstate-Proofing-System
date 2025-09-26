const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
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
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Create Socket.io server
  const io = new Server(server, {
    path: "/api/socketio",
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // Make io available globally for API routes
  global.io = io;

  // Socket.IO event handlers
  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // Join project room
    socket.on("join-project", (projectId) => {
      socket.join(`project-${projectId}`);
      console.log(`🔗 Socket ${socket.id} joined project ${projectId}`);
      console.log(`🔗 Project room: project-${projectId}`);
    });

    // Leave project room
    socket.on("leave-project", (projectId) => {
      socket.leave(`project-${projectId}`);
      console.log(`Socket ${socket.id} left project ${projectId}`);
    });

    // Annotation events
    socket.on("addAnnotation", (data) => {
      console.log("📝 Server received addAnnotation event:", data);
      console.log(
        "📝 Broadcasting to project room:",
        `project-${data.projectId}`
      );
      // Broadcast to all clients in the project room (including sender)
      io.to(`project-${data.projectId}`).emit("annotationAdded", {
        ...data,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        resolved: false,
      });
      console.log("📝 Broadcast sent successfully");
    });

    socket.on("resolveAnnotation", (data) => {
      console.log("✅ Annotation resolved:", data);
      // Broadcast to all clients in the project room
      io.to(`project-${data.projectId}`).emit("annotationResolved", {
        annotationId: data.annotationId,
        resolvedBy: data.resolvedBy,
        timestamp: new Date().toISOString(),
      });
    });

    // Comment events
    socket.on("addComment", (data) => {
      console.log("💬 Comment added:", data);
      // Broadcast to all clients in the project room
      io.to(`project-${data.projectId}`).emit("commentAdded", {
        ...data,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      });
    });

    // Annotation reply events
    socket.on("addAnnotationReply", (data) => {
      console.log("💬 Annotation reply added:", data);
      // Broadcast to all clients in the project room
      io.to(`project-${data.projectId}`).emit("annotationReplyAdded", {
        ...data,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      });
    });

    // Review status change events
    socket.on("reviewStatusChanged", (data) => {
      console.log("📋 Review status changed:", data);
      // Broadcast to all clients in the project room
      io.to(`project-${data.projectId}`).emit("reviewStatusUpdated", {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // Annotation status change events
    socket.on("annotationStatusChanged", (data) => {
      console.log("🔄 Annotation status changed:", data);
      // Broadcast to all clients in the project room
      io.to(`project-${data.projectId}`).emit("annotationStatusUpdated", {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // Annotation assignment events
    socket.on("annotationAssigned", (data) => {
      console.log("👤 Annotation assigned:", data);
      // Broadcast to all clients in the project room
      io.to(`project-${data.projectId}`).emit("annotationAssigned", {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // Status update events
    socket.on("updateElementStatus", (data) => {
      console.log("📊 Element status updated:", data);
      // Broadcast to all clients in the project room
      io.to(`project-${data.projectId}`).emit("statusChanged", {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // Project status events
    socket.on("projectStatusChanged", (data) => {
      console.log("📈 Project status changed:", data);
      // Broadcast to all clients in the project room
      io.to(`project-${data.projectId}`).emit("projectStatusChanged", {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // File upload events
    socket.on("fileUploaded", (data) => {
      console.log("📁 File uploaded:", data);
      // Broadcast to all clients in the project room
      io.to(`project-${data.projectId}`).emit("fileUploaded", {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // Test connection handler
    socket.on("test-connection", (data) => {
      console.log("🧪 Server received test connection:", data);
      socket.emit("test-response", { 
        message: "Server received test", 
        clientId: socket.id,
        projectId: data.projectId 
      });
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);
    });
  });

  // Start server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Server ready on http://${hostname}:${port}`);
    console.log(`🔌 Socket.io server running on port ${port}`);
  });
});
