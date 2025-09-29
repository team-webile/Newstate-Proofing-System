"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NotificationTest from "@/components/NotificationTest";

export default function TestNotificationsPage() {
  const [projectId, setProjectId] = useState("test-project-123");
  const [showTests, setShowTests] = useState(false);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Real-time Notification System Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Project ID</Label>
              <Input
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Enter project ID"
              />
            </div>
            <Button onClick={() => setShowTests(!showTests)}>
              {showTests ? "Hide" : "Show"} Test Components
            </Button>
          </CardContent>
        </Card>

        {showTests && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NotificationTest projectId={projectId} userType="admin" />
            <NotificationTest projectId={projectId} userType="client" />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Annotation Notifications</h4>
              <p className="text-sm text-muted-foreground">
                • Click "Test Annotation" on either admin or client side
                • The opposite side should receive a dummy success message
                • Admin annotation → Client gets "✅ Your annotation has been added successfully!"
                • Client annotation → Admin gets "✅ Client annotation received and saved!"
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Status Update Notifications</h4>
              <p className="text-sm text-muted-foreground">
                • Click "Test Status Update" on either side
                • The opposite side should receive a status update message
                • Admin status change → Client gets "✅ Review status updated to [status] by Admin"
                • Client status change → Admin gets "✅ Client updated review status to [status]"
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">3. Real-time Features</h4>
              <p className="text-sm text-muted-foreground">
                • Both sides should see notifications instantly
                • Notifications show sender/receiver information
                • Timestamps are displayed for each notification
                • Connection status is shown in the badge
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
