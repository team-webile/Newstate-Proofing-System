"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/lib/socket-io";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function SocketTest() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const {
    socket,
    addAnnotation,
    addAnnotationReply,
    updateReviewStatus,
    isConnected: socketConnected,
  } = useSocket("test-project-123");

  useEffect(() => {
    if (socket) {
      const handleConnect = () => {
        setIsConnected(true);
        addMessage("✅ Socket connected successfully!");
      };

      const handleDisconnect = () => {
        setIsConnected(false);
        addMessage("❌ Socket disconnected");
      };

      const handleAnnotationAdded = (data: any) => {
        addMessage(`📝 Annotation added: ${data.annotation}`);
      };

      const handleAnnotationReplyAdded = (data: any) => {
        addMessage(`💬 Reply added: ${data.reply}`);
      };

      const handleReviewStatusUpdated = (data: any) => {
        addMessage(`📋 Review status updated: ${data.status}`);
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("annotationAdded", handleAnnotationAdded);
      socket.on("annotationReplyAdded", handleAnnotationReplyAdded);
      socket.on("reviewStatusUpdated", handleReviewStatusUpdated);

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("annotationAdded", handleAnnotationAdded);
        socket.off("annotationReplyAdded", handleAnnotationReplyAdded);
        socket.off("reviewStatusUpdated", handleReviewStatusUpdated);
      };
    }
  }, [socket]);

  const addMessage = (message: string) => {
    setMessages((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testAnnotation = () => {
    addAnnotation({
      projectId: "test-project-123",
      fileId: "test-file-456",
      annotation: "Test annotation from client",
      coordinates: { x: 50, y: 30 },
      addedBy: "Client",
      addedByName: "Test User",
    });
    addMessage("📤 Sent test annotation");
  };

  const testReply = () => {
    addAnnotationReply({
      projectId: "test-project-123",
      annotationId: "test-annotation-789",
      reply: "Test reply from client",
      addedBy: "Client",
      addedByName: "Test User",
    });
    addMessage("📤 Sent test reply");
  };

  const testStatusUpdate = () => {
    updateReviewStatus({
      projectId: "test-project-123",
      reviewId: "test-review-456",
      status: "APPROVED",
      updatedBy: "Test User",
    });
    addMessage("📤 Sent test status update");
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Socket.io Connection Test
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testAnnotation} disabled={!isConnected}>
            Test Annotation
          </Button>
          <Button onClick={testReply} disabled={!isConnected}>
            Test Reply
          </Button>
          <Button onClick={testStatusUpdate} disabled={!isConnected}>
            Test Status Update
          </Button>
        </div>

        <div className="h-64 overflow-y-auto border rounded p-4 bg-muted">
          <h4 className="font-medium mb-2">Socket Events:</h4>
          {messages.length === 0 ? (
            <p className="text-muted-foreground">No events yet...</p>
          ) : (
            <div className="space-y-1">
              {messages.map((message, index) => (
                <div key={index} className="text-sm font-mono">
                  {message}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Socket ID: {socket?.id || "Not connected"}</p>
          <p>
            Connection Status:{" "}
            {socketConnected() ? "✅ Connected" : "❌ Disconnected"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
