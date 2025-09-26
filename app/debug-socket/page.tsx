"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/lib/socket-io";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DebugSocketPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const {
    socket,
    addAnnotation,
    addAnnotationReply,
    updateReviewStatus,
    isConnected: socketConnected,
    onAnnotationAdded,
    onAnnotationReplyAdded,
    onReviewStatusUpdated,
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

      // Set up event listeners
      onAnnotationAdded((data) => {
        addMessage(
          `📝 Annotation added: ${data.annotation} by ${data.addedByName}`
        );
      });

      onAnnotationReplyAdded((data) => {
        addMessage(
          `💬 Reply added: ${data.reply} to ${data.annotationId} by ${data.addedByName}`
        );
      });

      onReviewStatusUpdated((data) => {
        addMessage(
          `📋 Review status updated: ${data.status} for ${data.reviewId}`
        );
      });

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
      };
    }
  }, [
    socket,
    onAnnotationAdded,
    onAnnotationReplyAdded,
    onReviewStatusUpdated,
  ]);

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
      annotation: "Test annotation from debug page",
      coordinates: { x: 50, y: 30 },
      addedBy: "Client",
      addedByName: "Debug User",
    });
    addMessage("📤 Sent test annotation");
  };

  const testReply = () => {
    addAnnotationReply({
      projectId: "test-project-123",
      annotationId: "test-annotation-789",
      reply: "Test reply from debug page",
      addedBy: "Client",
      addedByName: "Debug User",
    });
    addMessage("📤 Sent test reply");
  };

  const testStatusUpdate = () => {
    updateReviewStatus({
      projectId: "test-project-123",
      reviewId: "test-review-456",
      status: "APPROVED",
      updatedBy: "Debug User",
    });
    addMessage("📤 Sent test status update");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Socket.io Debug Page</h1>
          <p className="text-muted-foreground">
            Debug socket connection and real-time events
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Socket Connection Status
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
      </div>
    </div>
  );
}
