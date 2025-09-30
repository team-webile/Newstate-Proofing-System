"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";

interface NotificationTestProps {
  projectId: string;
  userType: 'admin' | 'client';
}

export default function NotificationTest({ projectId, userType }: NotificationTestProps) {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    from: string;
    to: string;
  }>>([]);

  useEffect(() => {
    if (!projectId) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      path: "/api/socketio",
      transports: ["websocket", "polling"],
    });

    setSocket(newSocket);

    // Join project room
    newSocket.emit("join-project", projectId);

    // Connection events
    newSocket.on("connect", () => {
      console.log("🔌 Test Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 Test Socket disconnected");
      setIsConnected(false);
    });

    // Listen for dummy success messages
    newSocket.on("dummySuccessMessage", (data: {
      type: string;
      message: string;
      from: string;
      to: string;
      timestamp: string;
    }) => {
      console.log("💬 Test received dummy success message:", data);
      
      setNotifications(prev => [{
        id: Date.now().toString(),
        type: data.type,
        message: data.message,
        timestamp: data.timestamp,
        from: data.from,
        to: data.to
      }, ...prev.slice(0, 9)]);
    });

    // Listen for review status updates
    newSocket.on("reviewStatusUpdated", (data: {
      reviewId: string;
      projectId: string;
      status: string;
      message: string;
      timestamp: string;
      isFromAdmin: boolean;
    }) => {
      console.log("📊 Test received review status update:", data);
      
      setNotifications(prev => [{
        id: Date.now().toString(),
        type: 'status_update',
        message: data.message,
        timestamp: data.timestamp,
        from: data.isFromAdmin ? 'Admin' : 'Client',
        to: data.isFromAdmin ? 'Client' : 'Admin'
      }, ...prev.slice(0, 9)]);
    });

    return () => {
      newSocket.emit("leave-project", projectId);
      newSocket.close();
    };
  }, [projectId]);

  const testAnnotation = () => {
    if (!socket || !isConnected) return;

    const testData = {
      projectId,
      fileId: 'test-file-1',
      annotation: `Test annotation from ${userType}`,
      coordinates: { x: 50, y: 50 },
      addedBy: userType === 'admin' ? 'Admin' : 'Client',
      addedByName: userType === 'admin' ? 'Admin User' : 'Client User'
    };

    socket.emit("addAnnotation", testData);
  };

  const testStatusUpdate = () => {
    if (!socket || !isConnected) return;

    const testData = {
      projectId,
      reviewId: 'test-review-1',
      status: userType === 'admin' ? 'APPROVED' : 'PENDING',
      updatedBy: userType === 'admin' ? 'Admin' : 'Client'
    };

    socket.emit("reviewStatusChanged", testData);
  };

  const testSocketAPI = async () => {
    try {
      const response = await fetch('/api/test-socket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          message: `Test message from ${userType}`,
          userType
        }),
      });

      const data = await response.json();
      console.log('Test API response:', data);
    } catch (error) {
      console.error('Test API error:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.MessageCircle />
          Notification Test - {userType.toUpperCase()}
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
          <Button onClick={testStatusUpdate} disabled={!isConnected}>
            Test Status Update
          </Button>
          <Button onClick={testSocketAPI} disabled={!isConnected}>
            Test Socket API
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Recent Notifications:</h4>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 bg-muted rounded-lg border"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{notification.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {notification.from} → {notification.to}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{notification.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
