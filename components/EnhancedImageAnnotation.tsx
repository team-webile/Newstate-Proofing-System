"use client";

import { useState, useEffect } from "react";
import ImageAnnotation from "./ImageAnnotation";
import { useRealtimeComments } from "@/hooks/use-realtime-comments";

interface EnhancedImageAnnotationProps {
  imageUrl: string;
  imageAlt: string;
  fileId: string;
  projectId: string;
  isAdmin?: boolean;
  currentUser?: {
    name: string;
    role: string;
  };
}

export default function EnhancedImageAnnotation({
  imageUrl,
  imageAlt,
  fileId,
  projectId,
  isAdmin = false,
  currentUser = { name: "User", role: "Client" },
}: EnhancedImageAnnotationProps) {
  const [annotations, setAnnotations] = useState<any[]>([]);

  // Use real-time comments hook
  const {
    annotations: realtimeAnnotations,
    isLoading,
    error,
    isConnected,
    reviewStatus,
    annotationsDisabled,
    addAnnotation: addRealtimeAnnotation,
    addAnnotationReply: addRealtimeAnnotationReply,
    resolveAnnotation: resolveRealtimeAnnotation,
  } = useRealtimeComments({
    projectId,
    elementId: fileId,
    fileId,
    currentUser,
  });

  // Update local annotations when real-time annotations change
  useEffect(() => {
    setAnnotations(realtimeAnnotations);
  }, [realtimeAnnotations]);

  const handleAnnotationAdd = async (annotation: any) => {
    try {
      await addRealtimeAnnotation(annotation);
    } catch (error) {
      console.error("Error adding annotation:", error);
    }
  };

  const handleAnnotationResolve = async (annotationId: string) => {
    try {
      await resolveRealtimeAnnotation(annotationId);
    } catch (error) {
      console.error("Error resolving annotation:", error);
    }
  };

  const handleAnnotationReply = async (annotationId: string, reply: string) => {
    try {
      await addRealtimeAnnotationReply(annotationId, reply);
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        ></div>
        <span className="text-muted-foreground">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Enhanced Image Annotation Component */}
      <ImageAnnotation
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        fileId={fileId}
        projectId={projectId}
        annotations={annotations}
        onAnnotationAdd={handleAnnotationAdd}
        onAnnotationResolve={handleAnnotationResolve}
        onAnnotationReply={handleAnnotationReply}
        isAdmin={isAdmin}
        currentUser={currentUser}
        annotationsDisabled={annotationsDisabled}
        reviewStatus={reviewStatus}
      />

      {/* Annotation Summary */}
      {annotations.length > 0 && (
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Annotation Summary</h3>
          <div className="space-y-2">
            <div className="text-sm">
              Total Annotations: {annotations.length}
            </div>
            <div className="text-sm">
              Resolved: {annotations.filter((a) => a.resolved).length}
            </div>
            <div className="text-sm">
              Pending: {annotations.filter((a) => !a.resolved).length}
            </div>
            <div className="text-sm">
              Total Replies:{" "}
              {annotations.reduce(
                (sum, a) => sum + (a.replies?.length || 0),
                0
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
