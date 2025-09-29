import { io, Socket } from "socket.io-client";

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(projectId: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    
    if (!socketUrl) {
      console.error('❌ NEXT_PUBLIC_SOCKET_URL is not defined in environment variables');
      throw new Error('Socket URL not configured');
    }
    
    this.socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      forceNew: true,
      timeout: 20000,
      upgrade: true,
      rememberUpgrade: false
    });

    // Connection event handlers
    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket?.id);
      console.log("🔗 Socket URL:", socketUrl);
      this.reconnectAttempts = 0;
      // Join project room after connection
      this.socket?.emit("join-project", projectId);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      console.error("🔗 Attempted URL:", socketUrl);
      this.reconnectAttempts++;
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("❌ Socket reconnection error:", error);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("❌ Socket reconnection failed after", this.maxReconnectAttempts, "attempts");
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.emit("leave-project");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Annotation events
  addAnnotation(data: {
    projectId: string;
    fileId: string;
    annotation: string;
    coordinates: { x: number; y: number };
    addedBy: string;
    addedByName: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("addAnnotation", data);
    }
  }

  resolveAnnotation(data: {
    projectId: string;
    annotationId: string;
    resolvedBy: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("resolveAnnotation", data);
    }
  }

  // Status update events
  updateElementStatus(data: {
    projectId: string;
    elementId: string;
    status: string;
    updatedBy: string;
    comment?: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("updateElementStatus", data);
    }
  }

  // Comment events
  addComment(data: {
    projectId: string;
    elementId: string;
    comment: string;
    addedBy: string;
    addedByName: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("addComment", data);
    }
  }

  // Annotation reply events
  addAnnotationReply(data: {
    projectId: string;
    annotationId: string;
    reply: string;
    addedBy: string;
    addedByName: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("addAnnotationReply", data);
    }
  }

  // Review status events
  updateReviewStatus(data: {
    projectId: string;
    reviewId: string;
    status: string;
    updatedBy: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("reviewStatusChanged", data);
    }
  }

  // Event listeners
  onAnnotationAdded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off("annotationAdded"); // Remove existing listeners
      this.socket.on("annotationAdded", callback);
    }
  }

  onAnnotationResolved(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off("annotationResolved"); // Remove existing listeners
      this.socket.on("annotationResolved", callback);
    }
  }

  onStatusChanged(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off("statusChanged"); // Remove existing listeners
      this.socket.on("statusChanged", callback);
    }
  }

  onCommentAdded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off("commentAdded"); // Remove existing listeners
      this.socket.on("commentAdded", callback);
    }
  }

  onAnnotationReplyAdded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off("annotationReplyAdded"); // Remove existing listeners
      this.socket.on("annotationReplyAdded", callback);
    }
  }

  onReviewStatusUpdated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off("reviewStatusUpdated"); // Remove existing listeners
      this.socket.on("reviewStatusUpdated", callback);
    }
  }

  onAnnotationStatusUpdated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off("annotationStatusUpdated"); // Remove existing listeners
      this.socket.on("annotationStatusUpdated", callback);
    }
  }

  // Remove listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
export const socketManager = new SocketManager();

// Hook for React components
export function useSocket(projectId: string) {
  const socket = socketManager.connect(projectId);

  return {
    socket,
    addAnnotation: socketManager.addAnnotation.bind(socketManager),
    resolveAnnotation: socketManager.resolveAnnotation.bind(socketManager),
    updateElementStatus: socketManager.updateElementStatus.bind(socketManager),
    addComment: socketManager.addComment.bind(socketManager),
    addAnnotationReply: socketManager.addAnnotationReply.bind(socketManager),
    updateReviewStatus: socketManager.updateReviewStatus.bind(socketManager),
    onAnnotationAdded: socketManager.onAnnotationAdded.bind(socketManager),
    onAnnotationResolved:
      socketManager.onAnnotationResolved.bind(socketManager),
    onStatusChanged: socketManager.onStatusChanged.bind(socketManager),
    onCommentAdded: socketManager.onCommentAdded.bind(socketManager),
    onAnnotationReplyAdded:
      socketManager.onAnnotationReplyAdded.bind(socketManager),
    onReviewStatusUpdated:
      socketManager.onReviewStatusUpdated.bind(socketManager),
    onAnnotationStatusUpdated:
      socketManager.onAnnotationStatusUpdated.bind(socketManager),
    removeAllListeners: socketManager.removeAllListeners.bind(socketManager),
    isConnected: socketManager.isConnected.bind(socketManager),
    disconnect: socketManager.disconnect.bind(socketManager),
  };
}
