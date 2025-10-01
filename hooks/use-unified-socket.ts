import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface SocketEvents {
  onAnnotationAdded?: (data: any) => void;
  onAnnotationReplyAdded?: (data: any) => void;
  onReplyEdited?: (data: any) => void;
  onReplyDeleted?: (data: any) => void;
  onAnnotationStatusUpdated?: (data: any) => void;
  onAnnotationResolved?: (data: any) => void;
  onReviewStatusUpdated?: (data: any) => void;
  onReviewStatusChanged?: (data: any) => void;
  onProjectStatusChanged?: (data: any) => void;
  onFileUploaded?: (data: any) => void;
  onStatusChanged?: (data: any) => void;
  onTyping?: (data: any) => void;
  onDummySuccessMessage?: (data: any) => void;
}

interface UseUnifiedSocketProps {
  projectId: string;
  events?: SocketEvents;
  autoConnect?: boolean;
}

export function useUnifiedSocket({
  projectId,
  events = {},
  autoConnect = true,
}: UseUnifiedSocketProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect || !projectId) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    
    if (!socketUrl) {
      console.error('❌ NEXT_PUBLIC_SOCKET_URL is not defined in environment variables');
      return;
    }
    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    // Connection events
    newSocket.on("connect", () => {
      console.log("🔌 Unified Socket connected:", newSocket.id);
      setIsConnected(true);
      setConnectionError(null);

      // Join project room
      newSocket.emit("join-project", projectId);
      console.log(`🔗 Joined project room: project-${projectId}`);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Unified Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("🔌 Unified Socket connection error:", error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Annotation events
    newSocket.on("annotationAdded", (data) => {
      console.log("📝 Unified Socket - annotationAdded:", data);
      events.onAnnotationAdded?.(data);
    });

    newSocket.on("annotationReplyAdded", (data) => {
      console.log("💬 Unified Socket - annotationReplyAdded:", data);
      events.onAnnotationReplyAdded?.(data);
    });

    newSocket.on("replyEdited", (data) => {
      console.log("✏️ Unified Socket - replyEdited:", data);
      events.onReplyEdited?.(data);
    });

    newSocket.on("replyDeleted", (data) => {
      console.log("🗑️ Unified Socket - replyDeleted:", data);
      events.onReplyDeleted?.(data);
    });

    newSocket.on("annotationStatusUpdated", (data) => {
      console.log("🔄 Unified Socket - annotationStatusUpdated:", data);
      events.onAnnotationStatusUpdated?.(data);
    });

    newSocket.on("annotationResolved", (data) => {
      console.log("✅ Unified Socket - annotationResolved:", data);
      events.onAnnotationResolved?.(data);
    });

    newSocket.on("reviewStatusUpdated", (data) => {
      console.log("📋 Unified Socket - reviewStatusUpdated:", data);
      events.onReviewStatusUpdated?.(data);
    });

    newSocket.on("reviewStatusChanged", (data) => {
      console.log("🔄 Unified Socket - reviewStatusChanged:", data);
      events.onReviewStatusChanged?.(data);
    });

    newSocket.on("projectStatusChanged", (data) => {
      console.log("📊 Unified Socket - projectStatusChanged:", data);
      events.onProjectStatusChanged?.(data);
    });

    newSocket.on("fileUploaded", (data) => {
      console.log("📁 Unified Socket - fileUploaded:", data);
      events.onFileUploaded?.(data);
    });

    newSocket.on("statusChanged", (data) => {
      console.log("📈 Unified Socket - statusChanged:", data);
      events.onStatusChanged?.(data);
    });

    newSocket.on("typing", (data) => {
      console.log("⌨️ Unified Socket - typing:", data);
      events.onTyping?.(data);
    });

    newSocket.on("dummySuccessMessage", (data) => {
      console.log("💬 Unified Socket - dummySuccessMessage:", data);
      events.onDummySuccessMessage?.(data);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.emit("leave-project", projectId);
      newSocket.disconnect();
    };
  }, [projectId, autoConnect]);

  // Socket action functions
  const emitAnnotation = useCallback(
    (data: any) => {
      if (!socket || !isConnected) {
        console.warn("⚠️ Socket not connected, cannot emit annotation");
        return false;
      }

      console.log("📝 Emitting annotation:", data);
      socket.emit("addAnnotation", data);
      return true;
    },
    [socket, isConnected]
  );

  const emitAnnotationReply = useCallback(
    (data: any) => {
      if (!socket || !isConnected) {
        console.warn("⚠️ Socket not connected, cannot emit annotation reply");
        return false;
      }

      console.log("💬 Emitting annotation reply:", data);
      socket.emit("addAnnotationReply", data);
      return true;
    },
    [socket, isConnected]
  );

  const emitReplyEdit = useCallback(
    (data: any) => {
      if (!socket || !isConnected) {
        console.warn("⚠️ Socket not connected, cannot emit reply edit");
        return false;
      }

      console.log("✏️ Emitting reply edit:", data);
      socket.emit("editReply", data);
      return true;
    },
    [socket, isConnected]
  );

  const emitReplyDelete = useCallback(
    (data: any) => {
      if (!socket || !isConnected) {
        console.warn("⚠️ Socket not connected, cannot emit reply delete");
        return false;
      }

      console.log("🗑️ Emitting reply delete:", data);
      socket.emit("deleteReply", data);
      return true;
    },
    [socket, isConnected]
  );

  const emitAnnotationStatusChange = useCallback(
    (data: any) => {
      if (!socket || !isConnected) {
        console.warn("⚠️ Socket not connected, cannot emit status change");
        return false;
      }

      console.log("🔄 Emitting annotation status change:", data);
      socket.emit("annotationStatusChanged", data);
      return true;
    },
    [socket, isConnected]
  );

  const emitReviewStatusChange = useCallback(
    (data: any) => {
      if (!socket || !isConnected) {
        console.warn(
          "⚠️ Socket not connected, cannot emit review status change"
        );
        return false;
      }

      console.log("📋 Emitting review status change:", data);
      socket.emit("reviewStatusChanged", data);
      return true;
    },
    [socket, isConnected]
  );

  const emitProjectStatusChange = useCallback(
    (data: any) => {
      if (!socket || !isConnected) {
        console.warn(
          "⚠️ Socket not connected, cannot emit project status change"
        );
        return false;
      }

      console.log("📊 Emitting project status change:", data);
      socket.emit("projectStatusChanged", data);
      return true;
    },
    [socket, isConnected]
  );

  const emitTyping = useCallback(
    (data: any) => {
      if (!socket || !isConnected) {
        console.warn("⚠️ Socket not connected, cannot emit typing");
        return false;
      }

      console.log("⌨️ Emitting typing indicator:", data);
      socket.emit("typing", data);
      return true;
    },
    [socket, isConnected]
  );

  const reconnect = useCallback(() => {
    if (socket) {
      socket.connect();
    }
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.emit("leave-project", projectId);
      socket.disconnect();
    }
  }, [socket, projectId]);

  return {
    socket,
    isConnected,
    connectionError,
    emitAnnotation,
    emitAnnotationReply,
    emitReplyEdit,
    emitReplyDelete,
    emitAnnotationStatusChange,
    emitReviewStatusChange,
    emitProjectStatusChange,
    emitTyping,
    reconnect,
    disconnect,
  };
}
