import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface Annotation {
  id: string;
  content: string;
  fileId: string;
  projectId: string;
  coordinates?: string;
  addedBy: string;
  addedByName: string;
  isResolved: boolean;
  status: string;
  createdAt: string;
  timestamp: string;
}

interface AnnotationReply {
  id: string;
  content: string;
  addedBy: string;
  addedByName: string;
  createdAt: string;
}

interface SocketEvents {
  onAnnotationAdded: (annotation: Annotation) => void;
  onAnnotationResolved: (data: {
    annotationId: string;
    resolvedBy: string;
    timestamp: string;
  }) => void;
  onAnnotationReplyAdded: (data: {
    projectId: string;
    annotationId: string;
    reply: AnnotationReply;
    timestamp: string;
  }) => void;
  onAnnotationStatusUpdated: (data: {
    annotationId: string;
    projectId: string;
    status: string;
    isResolved: boolean;
    timestamp: string;
  }) => void;
  onTyping: (data: {
    projectId: string;
    user: string;
    isTyping: boolean;
    timestamp: string;
  }) => void;
}

export function useRealtimeAnnotations(
  projectId: string,
  events: SocketEvents
) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Initialize socket connection
  useEffect(() => {
    if (!projectId) return;

    // Don't initialize socket during build time or SSR
    if (typeof window === "undefined") {
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    
    if (!socketUrl) {
      console.error('❌ NEXT_PUBLIC_SOCKET_URL is not defined in environment variables');
      return;
    }
    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: false, // Don't auto-connect during build
    });

    // Only connect if we're in development or if explicitly enabled
    if (process.env.NODE_ENV === "development") {
      newSocket.connect();
    }

    // Connection events
    newSocket.on("connect", () => {
      console.log("🔌 Connected to socket server");
      setIsConnected(true);

      // Join project room
      newSocket.emit("join-project", projectId);
      console.log(`🔗 Joined project room: project-${projectId}`);
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 Disconnected from socket server");
      setIsConnected(false);
    });

    // Annotation events
    newSocket.on("annotationAdded", (annotation: Annotation) => {
      console.log("📝 Received annotationAdded:", annotation);
      events.onAnnotationAdded(annotation);
    });

    newSocket.on("annotationResolved", (data) => {
      console.log("✅ Received annotationResolved:", data);
      events.onAnnotationResolved(data);
    });

    newSocket.on("annotationReplyAdded", (data) => {
      console.log("💬 Received annotationReplyAdded:", data);
      events.onAnnotationReplyAdded(data);
    });

    newSocket.on("annotationStatusUpdated", (data) => {
      console.log("🔄 Received annotationStatusUpdated:", data);
      events.onAnnotationStatusUpdated(data);
    });

    // Typing indicator events
    newSocket.on("typing", (data) => {
      console.log("⌨️ Received typing indicator:", data);
      events.onTyping(data);

      // Update typing users list
      setTypingUsers((prev) => {
        if (data.isTyping) {
          return [...prev.filter((user) => user !== data.user), data.user];
        } else {
          return prev.filter((user) => user !== data.user);
        }
      });
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.emit("leave-project", projectId);
      newSocket.disconnect();
    };
  }, [projectId]);

  // Socket action functions
  const addAnnotation = useCallback(
    (annotationData: Omit<Annotation, "id" | "timestamp">) => {
      if (!socket || !isConnected) return;

      console.log("📝 Sending addAnnotation event:", annotationData);
      socket.emit("addAnnotation", annotationData);
    },
    [socket, isConnected]
  );

  const resolveAnnotation = useCallback(
    (annotationId: string, resolvedBy: string) => {
      if (!socket || !isConnected) return;

      console.log("✅ Sending resolveAnnotation event:", {
        annotationId,
        resolvedBy,
      });
      socket.emit("resolveAnnotation", {
        annotationId,
        resolvedBy,
        projectId,
      });
    },
    [socket, isConnected, projectId]
  );

  const addAnnotationReply = useCallback(
    (replyData: {
      annotationId: string;
      content: string;
      addedBy: string;
      addedByName: string;
    }) => {
      if (!socket || !isConnected) return;

      console.log("💬 Sending addAnnotationReply event:", replyData);
      socket.emit("addAnnotationReply", {
        ...replyData,
        projectId,
        timestamp: new Date().toISOString(),
      });
    },
    [socket, isConnected, projectId]
  );

  const updateAnnotationStatus = useCallback(
    (annotationId: string, status: string, resolvedBy?: string) => {
      if (!socket || !isConnected) return;

      console.log("🔄 Sending annotationStatusChanged event:", {
        annotationId,
        status,
        resolvedBy,
      });
      socket.emit("annotationStatusChanged", {
        annotationId,
        status,
        resolvedBy,
        projectId,
      });
    },
    [socket, isConnected, projectId]
  );

  const sendTypingIndicator = useCallback(
    (isTyping: boolean, user: string) => {
      if (!socket || !isConnected) return;

      console.log("⌨️ Sending typing indicator:", { isTyping, user });
      socket.emit("typing", {
        projectId,
        user,
        isTyping,
        timestamp: new Date().toISOString(),
      });
    },
    [socket, isConnected, projectId]
  );

  return {
    socket,
    isConnected,
    typingUsers,
    addAnnotation,
    resolveAnnotation,
    addAnnotationReply,
    updateAnnotationStatus,
    sendTypingIndicator,
  };
}
