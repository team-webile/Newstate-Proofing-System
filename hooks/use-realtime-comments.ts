"use client";

import { useState, useEffect, useCallback } from "react";
import { useSocket } from "@/lib/socket-io";

interface Comment {
  id: string;
  elementId: string;
  commentText: string;
  coordinates?: string;
  userName: string;
  createdAt: string;
  type: "GENERAL" | "ANNOTATION";
  status: "ACTIVE" | "RESOLVED";
  parentId?: string;
  replies?: Comment[];
}

interface Annotation {
  id: string;
  x: number;
  y: number;
  comment: string;
  content: string; // Add content field for compatibility
  timestamp: string;
  createdAt: string; // Add createdAt field for compatibility
  resolved: boolean;
  isResolved: boolean; // Add isResolved field for compatibility
  fileId: string;
  addedBy?: string;
  addedByName?: string;
  status: "PENDING" | "COMPLETED" | "REJECTED"; // Add status field
  replies?: {
    id: string;
    content: string;
    addedBy: string;
    addedByName?: string;
    createdAt: string;
  }[];
}

interface UseRealtimeCommentsProps {
  projectId: string;
  elementId?: string;
  fileId?: string;
  currentUser: {
    name: string;
    role: string;
  };
}

export function useRealtimeComments({
  projectId,
  elementId,
  fileId,
  currentUser,
}: UseRealtimeCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>("PENDING");
  const [annotationsDisabled, setAnnotationsDisabled] = useState(false);

  const {
    socket,
    addAnnotation: socketAddAnnotation,
    resolveAnnotation: socketResolveAnnotation,
    updateElementStatus: socketUpdateStatus,
    addComment: socketAddComment,
    addAnnotationReply: socketAddAnnotationReply,
    updateReviewStatus: socketUpdateReviewStatus,
    onAnnotationAdded,
    onAnnotationResolved,
    onStatusChanged,
    onCommentAdded,
    onAnnotationReplyAdded,
    onReviewStatusUpdated,
    onAnnotationStatusUpdated,
    removeAllListeners,
    isConnected,
  } = useSocket(projectId);

  // Fetch initial comments
  const fetchComments = useCallback(async () => {
    // Skip if projectId is empty
    if (!projectId) {
      console.warn("Skipping comments fetch: projectId is empty");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/comments?projectId=${projectId}${
          elementId ? `&elementId=${elementId}` : ""
        }`
      );
      const data = await response.json();

      if (data.status === "success") {
        setComments(data.data || []);
      } else {
        setError(data.message || "Failed to fetch comments");
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to fetch comments");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, elementId]);

  // Fetch initial annotations
  const fetchAnnotations = useCallback(async () => {
    // Skip if projectId is empty
    if (!projectId) {
      console.warn("Skipping annotations fetch: projectId is empty");
      return;
    }

    try {
      const response = await fetch(
        `/api/annotations?projectId=${projectId}${
          fileId ? `&fileId=${fileId}` : ""
        }`
      );
      const data = await response.json();

      if (data.status === "success") {
        // Transform annotations to match expected format
        const transformedAnnotations = (data.data || []).map(
          (annotation: any) => ({
            id: annotation.id,
            x: annotation.x || 0,
            y: annotation.y || 0,
            comment: annotation.content,
            timestamp: annotation.createdAt,
            resolved: annotation.isResolved || false,
            fileId: annotation.fileId,
            addedBy: annotation.addedBy,
            addedByName: annotation.addedByName,
          })
        );
        setAnnotations(transformedAnnotations);
      }
    } catch (err) {
      console.error("Error fetching annotations:", err);
    }
  }, [projectId, fileId]);

  // Add new comment
  const addComment = useCallback(
    async (commentText: string, coordinates?: string, parentId?: string) => {
      try {
        const response = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            elementId,
            projectId,
            commentText,
            coordinates,
            userName: currentUser.name,
            parentId,
            type: coordinates ? "ANNOTATION" : "GENERAL",
          }),
        });

        const data = await response.json();

        if (data.status === "success") {
          // Emit socket event
          socketAddComment({
            projectId,
            elementId: elementId || "",
            comment: commentText,
            addedBy: currentUser.role,
            addedByName: currentUser.name,
          });

          // Update local state
          setComments((prev) => [data.data, ...prev]);
          return data.data;
        } else {
          throw new Error(data.message || "Failed to add comment");
        }
      } catch (err) {
        console.error("Error adding comment:", err);
        throw err;
      }
    },
    [projectId, elementId, currentUser, socketAddComment]
  );

  // Add annotation
  const addAnnotation = useCallback(
    async (annotation: Omit<Annotation, "id" | "timestamp">) => {
      try {
        const response = await fetch("/api/annotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: annotation.comment,
            fileId: annotation.fileId,
            projectId,
            coordinates: { x: annotation.x, y: annotation.y },
            addedBy: currentUser.role,
            addedByName: currentUser.name,
          }),
        });

        const data = await response.json();

        if (data.status === "success") {
          // Emit socket event
          socketAddAnnotation({
            projectId,
            fileId: annotation.fileId,
            annotation: annotation.comment,
            coordinates: { x: annotation.x, y: annotation.y },
            addedBy: currentUser.role,
            addedByName: currentUser.name,
          });

          // Update local state with transformed annotation
          const transformedAnnotation = {
            id: data.data.id,
            x: data.data.x || 0,
            y: data.data.y || 0,
            comment: data.data.content,
            content: data.data.content, // Add content field
            timestamp: data.data.createdAt,
            createdAt: data.data.createdAt, // Add createdAt field
            resolved: data.data.isResolved || false,
            isResolved: data.data.isResolved || false, // Add isResolved field
            fileId: data.data.fileId,
            addedBy: data.data.addedBy,
            addedByName: data.data.addedByName,
            status: (data.data.status || "PENDING") as "PENDING" | "COMPLETED" | "REJECTED", // Add status field
            replies: data.data.replies || [],
          };
          setAnnotations((prev) => [transformedAnnotation, ...prev]);
          return transformedAnnotation;
        } else {
          throw new Error(data.message || "Failed to add annotation");
        }
      } catch (err) {
        console.error("Error adding annotation:", err);
        throw err;
      }
    },
    [projectId, currentUser, socketAddAnnotation]
  );

  // Add annotation reply
  const addAnnotationReply = useCallback(
    async (annotationId: string, reply: string) => {
      try {
        const response = await fetch("/api/annotations/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            annotationId,
            content: reply,
            addedBy: currentUser.role,
            addedByName: currentUser.name,
          }),
        });

        const data = await response.json();

        if (data.status === "success") {
          // Emit socket event for real-time updates
          socketAddAnnotationReply({
            projectId,
            annotationId,
            reply: reply,
            addedBy: currentUser.role,
            addedByName: currentUser.name,
          });

          // Update local state with new reply
          setAnnotations((prev) =>
            prev.map((annotation) =>
              annotation.id === annotationId
                ? {
                    ...annotation,
                    replies: [
                      ...(annotation.replies || []),
                      {
                        id: data.data.id,
                        content: data.data.content,
                        addedBy: data.data.addedBy,
                        addedByName: data.data.addedByName,
                        createdAt: data.data.createdAt,
                      },
                    ],
                  }
                : annotation
            )
          );
          return data.data;
        } else {
          throw new Error(data.message || "Failed to add reply");
        }
      } catch (err) {
        console.error("Error adding reply:", err);
        throw err;
      }
    },
    [currentUser]
  );

  // Resolve annotation
  const resolveAnnotation = useCallback(
    async (annotationId: string) => {
      try {
        const response = await fetch(
          `/api/annotations/${annotationId}/resolve`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          }
        );

        const data = await response.json();

        if (data.status === "success") {
          // Emit socket event
          socketResolveAnnotation({
            projectId,
            annotationId,
            resolvedBy: currentUser.name,
          });

          // Update local state
          setAnnotations((prev) =>
            prev.map((annotation) =>
              annotation.id === annotationId
                ? { ...annotation, resolved: true }
                : annotation
            )
          );
          return data.data;
        } else {
          throw new Error(data.message || "Failed to resolve annotation");
        }
      } catch (err) {
        console.error("Error resolving annotation:", err);
        throw err;
      }
    },
    [projectId, currentUser, socketResolveAnnotation]
  );

  // Update element status
  const updateElementStatus = useCallback(
    async (status: string, comment?: string) => {
      try {
        const response = await fetch(`/api/elements/${elementId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            comment,
          }),
        });

        const data = await response.json();

        if (data.status === "success") {
          // Emit socket event
          socketUpdateStatus({
            projectId,
            elementId: elementId || "",
            status,
            updatedBy: currentUser.name,
            comment,
          });

          return data.data;
        } else {
          throw new Error(data.message || "Failed to update status");
        }
      } catch (err) {
        console.error("Error updating status:", err);
        throw err;
      }
    },
    [projectId, elementId, currentUser, socketUpdateStatus]
  );

  // Setup real-time listeners
  useEffect(() => {
    if (!socket) return;

    // Annotation events
    onAnnotationAdded((data) => {
      if (data.fileId === fileId) {
        const transformedAnnotation = {
          id: data.id,
          x: data.coordinates?.x || 0,
          y: data.coordinates?.y || 0,
          comment: data.annotation,
          content: data.annotation, // Add content field
          timestamp: data.timestamp,
          createdAt: data.timestamp, // Add createdAt field
          resolved: false,
          isResolved: false, // Add isResolved field
          fileId: data.fileId,
          addedBy: data.addedBy,
          addedByName: data.addedByName,
          status: "PENDING" as "PENDING" | "COMPLETED" | "REJECTED", // Add status field
          replies: [],
        };
        setAnnotations((prev) => [transformedAnnotation, ...prev]);
      }
    });

    onAnnotationResolved((data) => {
      setAnnotations((prev) =>
        prev.map((annotation) =>
          annotation.id === data.annotationId
            ? { 
                ...annotation, 
                resolved: true,
                isResolved: true,
                status: "COMPLETED"
              }
            : annotation
        )
      );
    });

    // Listen for annotation reply events
    onAnnotationReplyAdded((data) => {
      console.log("Received annotation reply:", data);
      setAnnotations((prev) =>
        prev.map((annotation) =>
          annotation.id === data.annotationId
            ? {
                ...annotation,
                replies: [
                  ...(annotation.replies || []),
                  {
                    id: data.id,
                    content: data.reply,
                    addedBy: data.addedBy,
                    addedByName: data.addedByName,
                    createdAt: data.timestamp,
                  },
                ],
              }
            : annotation
        )
      );
    });

    // Listen for review status changes
    onReviewStatusUpdated((data) => {
      console.log("Review status updated:", data);
      setReviewStatus(data.status);
      setAnnotationsDisabled(
        data.status === "APPROVED" || data.status === "REJECTED"
      );
    });

    // Listen for annotation status changes
    onAnnotationStatusUpdated((data) => {
      console.log("Annotation status updated:", data);
      setAnnotations((prev) =>
        prev.map((annotation) =>
          annotation.id === data.annotationId
            ? {
                ...annotation,
                resolved: data.status === 'COMPLETED',
                isResolved: data.status === 'COMPLETED',
                status: data.status,
              }
            : annotation
        )
      );
    });

    // Comment events
    onCommentAdded((data) => {
      if (data.elementId === elementId) {
        setComments((prev) => [data, ...prev]);
      }
    });

    // Status events
    onStatusChanged((data) => {
      console.log("Status changed:", data);
      // Handle status updates
    });

    return () => {
      removeAllListeners();
    };
  }, [
    socket,
    fileId,
    elementId,
    onAnnotationAdded,
    onAnnotationResolved,
    onCommentAdded,
    onStatusChanged,
    onAnnotationReplyAdded,
    onReviewStatusUpdated,
    onAnnotationStatusUpdated,
    removeAllListeners,
  ]);

  // Initial data fetch
  useEffect(() => {
    fetchComments();
    if (fileId) {
      fetchAnnotations();
    }
  }, [fetchComments, fetchAnnotations, fileId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeAllListeners();
    };
  }, [removeAllListeners]);

  return {
    comments,
    annotations,
    isLoading,
    error,
    isConnected: isConnected(),
    reviewStatus,
    annotationsDisabled,
    addComment,
    addAnnotation,
    addAnnotationReply,
    resolveAnnotation,
    updateElementStatus,
    refetch: fetchComments,
  };
}
