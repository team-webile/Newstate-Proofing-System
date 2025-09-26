"use client";

import { useState } from "react";
import EnhancedImageAnnotation from "./EnhancedImageAnnotation";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export default function AnnotationReplyTest() {
  const [currentUser, setCurrentUser] = useState({
    name: "Client User",
    role: "Client",
  });
  const [reviewStatus, setReviewStatus] = useState("PENDING");

  const toggleUser = () => {
    setCurrentUser((prev) => ({
      name: prev.role === "Client" ? "Admin User" : "Client User",
      role: prev.role === "Client" ? "Admin" : "Client",
    }));
  };

  const updateReviewStatus = async (status: string) => {
    try {
      const response = await fetch("/api/reviews/test-review-123/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setReviewStatus(status);
      }
    } catch (error) {
      console.error("Error updating review status:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* User Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Annotation Reply Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  currentUser.role === "Admin" ? "bg-blue-500" : "bg-green-500"
                }`}
              ></div>
              <span className="font-medium">{currentUser.name}</span>
              <Badge
                variant={currentUser.role === "Admin" ? "default" : "secondary"}
              >
                {currentUser.role}
              </Badge>
            </div>
            <Button onClick={toggleUser} variant="outline" size="sm">
              Switch to {currentUser.role === "Client" ? "Admin" : "Client"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Both Admin and Client can add annotations and replies. Only Admin
            can resolve annotations.
          </p>
        </CardContent>
      </Card>

      {/* Review Status Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Review Status Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Current Status:</span>
              <Badge
                variant={
                  reviewStatus === "APPROVED"
                    ? "default"
                    : reviewStatus === "REJECTED"
                    ? "destructive"
                    : "secondary"
                }
              >
                {reviewStatus}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => updateReviewStatus("PENDING")}
                variant={reviewStatus === "PENDING" ? "default" : "outline"}
                size="sm"
              >
                Pending
              </Button>
              <Button
                onClick={() => updateReviewStatus("APPROVED")}
                variant={reviewStatus === "APPROVED" ? "default" : "outline"}
                size="sm"
              >
                Approve
              </Button>
              <Button
                onClick={() => updateReviewStatus("REJECTED")}
                variant={
                  reviewStatus === "REJECTED" ? "destructive" : "outline"
                }
                size="sm"
              >
                Reject
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            When status is APPROVED or REJECTED, annotations will be disabled.
          </p>
        </CardContent>
      </Card>

      {/* Enhanced Image Annotation */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Image Annotation</CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedImageAnnotation
            imageUrl="/placeholder.jpg"
            imageAlt="Test Image for Annotations"
            fileId="test-file-123"
            projectId="test-project-456"
            isAdmin={currentUser.role === "Admin"}
            currentUser={currentUser}
          />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Adding Annotations:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Click "Add Annotation" button</li>
                <li>• Click anywhere on the image</li>
                <li>• Enter your comment and submit</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Replying to Annotations:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Click on any annotation pin</li>
                <li>• Click "Reply" button</li>
                <li>• Enter your reply and submit</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Admin Features:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Can resolve annotations</li>
                <li>• See all replies from both roles</li>
                <li>• Manage annotation status</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Real-time Updates:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• See live updates from other users</li>
                <li>• Connection status indicator</li>
                <li>• Instant reply notifications</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
