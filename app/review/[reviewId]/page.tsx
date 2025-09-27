"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  PenTool,
  X,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  MapPin,
  Eye,
  MessageSquare,
} from "lucide-react";
// import ImageAnnotation from "@/components/ImageAnnotation"
import { useRealtimeComments } from "@/hooks/use-realtime-comments";
import io from "socket.io-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectAnnotation {
  id: string;
  content: string;
  fileId: string;
  addedBy: string;
  addedByName: string;
  createdAt: string;
  x?: number;
  y?: number;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  isResolved: boolean;
  replies?: Array<{
    id: string;
    content: string;
    addedBy: string;
    addedByName: string;
    createdAt: string;
  }>;
}

interface ProjectFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface Version {
  id: string;
  version: string;
  files: ProjectFile[];
  status: "draft" | "pending_review" | "completed" | "rejected" | "in_revision";
  createdAt: string;
  annotations: ProjectAnnotation[];
  revisionNotes?: string;
}

interface Revision {
  id: string;
  version: string;
  status: "in_revision" | "pending_review" | "completed" | "rejected";
  requestedBy: string;
  requestedAt: string;
  comments: string;
  digitalSignature?: {
    firstName: string;
    lastName: string;
  };
  completedAt?: string;
}

interface ReviewPageProps {
  params: {
    reviewId: string;
  };
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const [annotations, setAnnotations] = useState<ProjectAnnotation[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [fileAnnotations, setFileAnnotations] = useState<{
    [key: string]: string[];
  }>({});
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProjectFile | null>(null);
  // Socket is handled by useRealtimeComments hook
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      type: "annotation" | "status";
      message: string;
      timestamp: string;
      createdAt?: string;
      addedBy?: string;
      senderName?: string;
      isFromClient?: boolean;
    }>
  >([]);

  // Reply functionality state
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersion, setCurrentVersion] = useState("");
  const [currentFile, setCurrentFile] = useState<string>("");
  const [newComment, setNewComment] = useState("");
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] =
    useState<ProjectAnnotation | null>(null);
  const [showAnnotationPopup, setShowAnnotationPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showReplyPopup, setShowReplyPopup] = useState(false);
  const [selectedAnnotationForReply, setSelectedAnnotationForReply] = useState<ProjectAnnotation | null>(null);
  const [replyText, setReplyText] = useState("");
  const [digitalSignature, setDigitalSignature] = useState({
    firstName: "",
    lastName: "",
  });
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionComments, setRevisionComments] = useState("");
  const [showVersionComparison, setShowVersionComparison] = useState(false);
  const [compareVersion, setCompareVersion] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const currentVersionData = versions.find((v) => v.version === currentVersion);
  const currentFileData =
    currentVersionData?.files.find((f) => f.id === currentFile) ||
    currentVersionData?.files[0];

  // Client user info - no authentication required
  const currentUser = {
    name: "Client",
    role: "Client",
  };

  // Use real-time comments hook
  const {
    comments: realtimeComments,
    annotations: realtimeAnnotations,
    isLoading: commentsLoading,
    error: commentsError,
    isConnected,
    addComment: addRealtimeComment,
    addAnnotation: addRealtimeAnnotation,
    addAnnotationReply: addRealtimeAnnotationReply,
    resolveAnnotation: resolveRealtimeAnnotation,
    updateElementStatus: updateRealtimeElementStatus,
  } = useRealtimeComments({
    projectId: reviewData?.project?.id || "",
    elementId: currentFileData?.id,
    fileId: currentFileData?.id,
    currentUser,
  });

  // Fetch project data
  const fetchReviewData = async () => {
    try {
      setIsLoading(true);

      // Check if we have a file parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const fileId = urlParams.get("fileId");

      // Get project data using reviewId as projectId
      const projectResponse = await fetch(`/api/projects/${params.reviewId}`);
      const projectData = await projectResponse.json();

      if (projectData.status === "success") {
        // Get project versions from database
        const versionsResponse = await fetch(
          `/api/projects/${params.reviewId}/versions`
        );
        const versionsData = await versionsResponse.json();

        // Get project files
        const filesResponse = await fetch(
          `/api/projects/${params.reviewId}/files`
        );
        const filesData = await filesResponse.json();

        if (filesData.status === "success" && versionsData.status === "success") {
          // Transform project data to review format
          const transformedReviewData = {
            id: projectData.data.id,
            reviewName: projectData.data.title,
            project: projectData.data,
            status: projectData.data.status,
            createdAt: projectData.data.createdAt,
            elements: [
              {
                id: "main",
                elementName: "Project Files",
                status: projectData.data.status,
                versions: filesData.data.files.map((file: any) => ({
                  id: file.id,
                  fileName: file.name,
                  filePath: file.url,
                  fileType: file.type,
                  fileSize: file.size,
                  createdAt: file.uploadedAt,
                })),
              },
            ],
          };

          setReviewData(transformedReviewData);

          // Group files by version
          const filesByVersion: { [key: string]: any[] } = {};
          filesData.data.files.forEach((file: any) => {
            if (!filesByVersion[file.version]) {
              filesByVersion[file.version] = [];
            }
            filesByVersion[file.version].push({
              id: file.id,
              name: file.name,
              url: file.url,
              type: file.type,
              size: file.size,
              uploadedAt: file.uploadedAt,
            });
          });

          // Transform versions from database with their files
          const transformedVersions = versionsData.data.map((version: any) => ({
            id: version.id,
            version: version.version,
            files: filesByVersion[version.version] || [],
            status: version.status?.toLowerCase() || "pending_review",
            createdAt: version.createdAt,
            annotations: [],
          }));

          setVersions(transformedVersions as any);

          // Set first version as current
          if (transformedVersions.length > 0) {
            setCurrentVersion(transformedVersions[0].version);

            // If we have a file ID from URL, find which version it belongs to
            if (fileId) {
              let foundFile = false;
              for (const version of transformedVersions) {
                const file = version.files.find((f: any) => f.id === fileId);
                if (file) {
                  setCurrentVersion(version.version);
                  setCurrentFile(fileId);
                  foundFile = true;
                  break;
                }
              }
              if (!foundFile && transformedVersions[0].files.length > 0) {
                setCurrentFile(transformedVersions[0].files[0].id);
              }
            } else if (transformedVersions[0].files.length > 0) {
              setCurrentFile(transformedVersions[0].files[0].id);
            }
          }
        }
      } else if (
        reviewData.status === "error" &&
        reviewData.message === "Review not found"
      ) {
        // If review not found, get project data directly
        const projectId = params.reviewId.replace("review-", "");
        await fetchProjectData(projectId);
      } else {
        setError(reviewData.message || "Failed to load review data");
      }
    } catch (error) {
      console.error("Error fetching review data:", error);
      setError("Failed to load review data");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch project data directly if review doesn't exist
  const fetchProjectData = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (data.status === "success") {
        // Create mock review data from project
        const mockReviewData = {
          id: `review-${projectId}`,
          reviewName: data.data.title,
          description: data.data.description,
          status: "IN_PROGRESS",
          project: data.data,
          elements: [],
        };

        setReviewData(mockReviewData);

        // Create mock versions from project files if any
        const mockVersions = [
          {
            id: "1",
            version: "V1",
            files: [],
            status: "pending_review",
            createdAt: data.data.createdAt,
            annotations: [],
          },
        ];

        setVersions(mockVersions as any);
        setCurrentVersion("V1");
      } else {
        setError("Failed to load project data");
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      setError("Failed to load project data");
    }
  };

  // Create review for project if it doesn't exist
  const createReviewForProject = async (projectId: string) => {
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Project Review",
          description: "Review for project",
          projectId: projectId,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        // Retry fetching the review data
        await fetchReviewData();
      } else {
        setError("Failed to create review");
      }
    } catch (error) {
      console.error("Error creating review:", error);
      setError("Failed to create review");
    }
  };

  // Fetch annotations
  const fetchAnnotations = async () => {
    try {
      console.log("🔄 Fetching annotations for project:", params.reviewId);
      const response = await fetch(
        `/api/annotations?projectId=${params.reviewId}`
      );
      const data = await response.json();
      console.log("📝 Annotations API response:", data);

      if (data.status === "success") {
        console.log("📝 Raw annotations data:", data.data);

        // Check for date issues
        data.data.forEach((annotation: any, index: number) => {
          console.log(`📝 Annotation ${index}:`, {
            id: annotation.id,
            content: annotation.content,
            createdAt: annotation.createdAt,
            addedBy: annotation.addedBy,
            addedByName: annotation.addedByName,
            replies: annotation.replies?.length || 0
          });

          if (annotation.replies) {
            annotation.replies.forEach((reply: any, replyIndex: number) => {
              console.log(`📝 Reply ${replyIndex} for annotation ${annotation.id}:`, {
                id: reply.id,
                content: reply.content,
                createdAt: reply.createdAt,
                addedBy: reply.addedBy,
                addedByName: reply.addedByName
              });
            });
          }
        });

        // Transform annotations to ensure x, y coordinates are properly set
        const transformedAnnotations = data.data.map((annotation: any) => ({
          ...annotation,
          x: annotation.x || (annotation.coordinates ? JSON.parse(annotation.coordinates).x : undefined),
          y: annotation.y || (annotation.coordinates ? JSON.parse(annotation.coordinates).y : undefined)
        }));

        // Update the main annotations state for display
        setAnnotations(transformedAnnotations);
        console.log("📝 Updated annotations state:", transformedAnnotations);

        // Also group annotations by fileId for other uses
        const annotationsByFile: { [key: string]: any[] } = {};
        transformedAnnotations.forEach((annotation: any) => {
          if (!annotationsByFile[annotation.fileId]) {
            annotationsByFile[annotation.fileId] = [];
          }
          annotationsByFile[annotation.fileId].push(annotation);
        });
        console.log("📝 Grouped annotations by file:", annotationsByFile);
        setFileAnnotations(annotationsByFile);
        console.log("📝 Updated fileAnnotations state");
      } else {
        console.log("📝 Annotations API error:", data.message);
      }
    } catch (error) {
      console.error("Error fetching annotations:", error);
    }
  };

  useEffect(() => {
    fetchReviewData();
    fetchAnnotations();
  }, [params.reviewId]);

  useEffect(() => {
    if (currentVersionData?.files.length && !currentFile) {
      setCurrentFile(currentVersionData.files[0].id);
    }
  }, [currentVersionData, currentFile]);

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!currentFileData) return;

    // Don't allow adding annotations if status is completed
    if (currentVersionData?.status === 'completed') {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Check if clicking on a resolved annotation
    const clickedAnnotation = annotations.find((annotation) => {
      if (annotation.x !== undefined && annotation.y !== undefined) {
        const distance = Math.sqrt(
          Math.pow(annotation.x - x, 2) + Math.pow(annotation.y - y, 2)
        );
        return distance < 5; // Within 5% of the annotation position
      }
      return false;
    });

    // If clicking on a resolved annotation, don't show input
    if (clickedAnnotation && clickedAnnotation.isResolved) {
      return;
    }

    // Show annotation popup
    setNewComment("");
    setPopupPosition({ x, y });
    setShowAnnotationPopup(true);
  };

  // Check if all annotations are completed or rejected
  const areAllAnnotationsResolved = () => {
    return currentFileAnnotations.every(annotation =>
      annotation.status === 'completed' || annotation.status === 'rejected'
    );
  };

  const handleAnnotationClick = (annotation: any) => {
    // Don't allow replies to completed or rejected annotations
    if (annotation.status === 'completed' || annotation.status === 'rejected') {
      return;
    }

    setSelectedAnnotationForReply(annotation);
    setShowReplyPopup(true);
    setReplyText("");
  };

  const handleReplySubmit = async () => {
    if (!selectedAnnotationForReply || !replyText.trim()) return;

    try {
      const response = await fetch("/api/annotations/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annotationId: selectedAnnotationForReply.id,
          content: replyText,
          addedBy: "Client",
          addedByName: currentUser?.name || "Client",
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        // Update local state with new reply
        setAnnotations((prev) =>
          prev.map((annotation) =>
            annotation.id === selectedAnnotationForReply.id
              ? {
                ...annotation,
                replies: [
                  ...(annotation.replies || []),
                  {
                    id: data.data.id,
                    content: replyText,
                    addedBy: "Client",
                    addedByName: currentUser?.name || "Client",
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
              : annotation
          )
        );

        // Add to chat messages for real-time updates
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "annotation",
            message: `You replied: "${replyText}"`,
            timestamp: new Date().toISOString(),
            addedBy: "Client",
            senderName: currentUser?.name || "Client",
            isFromClient: true,
          },
        ]);

        // Emit socket event for real-time updates
        if (socket) {
          socket.emit("addAnnotationReply", {
            projectId: params.reviewId,
            annotationId: selectedAnnotationForReply.id,
            reply: replyText,
            addedBy: "Client",
            addedByName: currentUser?.name || "Client",
            timestamp: new Date().toISOString(),
          });
        }

        setReplyText("");
        setShowReplyPopup(false);
        setSelectedAnnotationForReply(null);
      } else {
        console.error("Failed to add reply:", data.message);
        alert("Failed to add reply. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      alert("Failed to add reply. Please try again.");
    }
  };

  const handleAnnotationResolve = (annotationId: string) => {
    const updatedAnnotations = annotations.map((annotation) =>
      annotation.id === annotationId
        ? {
          ...annotation,
          isResolved: !annotation.isResolved,
          status: annotation.isResolved
            ? ("PENDING" as const)
            : ("COMPLETED" as const),
        }
        : annotation
    );
    setAnnotations(updatedAnnotations);
  };

  const handleVersionChange = (version: string) => {
    setCurrentVersion(version);
    // Load annotations for the selected version
    const versionData = versions.find((v) => v.version === version);
    if (versionData) {
      setAnnotations(versionData.annotations || []);
      if (versionData.files.length > 0) {
        setCurrentFile(versionData.files[0].id);
      }
    }
  };

  const handleFileChange = (fileId: string) => {
    setCurrentFile(fileId);
    // Filter annotations for the selected file
    const fileAnnotations = annotations.filter((a) => a.fileId === fileId);
    // You might want to update the display of annotations here
  };

  const confirmApproval = () => {
    // Update revision status
    const updatedRevisions = revisions.map((r) =>
      r.version === currentVersion
        ? {
          ...r,
          status: "completed" as const,
          digitalSignature: digitalSignature,
          completedAt: new Date().toISOString(),
        }
        : r
    );
    setRevisions(updatedRevisions);

    // Update version status
    const updatedVersions = versions.map((v) =>
      v.version === currentVersion ? { ...v, status: "completed" as const } : v
    );
    setVersions(updatedVersions);

    console.log("Approval confirmed with signature:", digitalSignature);
    setShowApprovalDialog(false);
    setShowSignatureDialog(false);
    setDigitalSignature({ firstName: "", lastName: "" });
  };

  const handleRejection = () => {
    setShowRevisionDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "completed":
        return "bg-green-500";
      case "REJECTED":
      case "rejected":
        return "bg-red-500";
      case "PENDING_REVIEW":
      case "pending_review":
        return "bg-blue-500";
      case "DRAFT":
      case "draft":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      case "PENDING_REVIEW":
        return "Pending Review";
      case "DRAFT":
        return "Draft";
      case "completed":
        return "Completed";
      case "rejected":
        return "Rejected";
      case "in_revision":
        return "In Revision";
      case "pending_review":
        return "Pending Review";
      case "draft":
        return "Draft";
      default:
        return "Unknown";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const currentFileAnnotations = annotations.filter(
    (a) => a.fileId === currentFile
  );

  // Socket connection for direct emit calls
  const [socket, setSocket] = useState<any>(null);

  // Initialize Socket.io for direct emit calls
  useEffect(() => {
    if (params.reviewId) {
      const newSocket = io("http://localhost:3000", {
        path: "/api/socketio",
        transports: ["websocket", "polling"],
      });

      newSocket.on("connect", () => {
        console.log("🔌 Client socket connected:", newSocket.id);
        console.log("🔌 ReviewId from params:", params.reviewId);
        // Join project room immediately when connected
        newSocket.emit("join-project", params.reviewId);
        console.log("🔗 Client joining project room:", params.reviewId);

        // Test socket connection
        newSocket.emit("test-connection", { message: "Client socket test", projectId: params.reviewId });
      });

      newSocket.on("disconnect", () => {
        console.log("🔌 Client socket disconnected");
      });

      // Test event listener
      newSocket.on("test-response", (data) => {
        console.log("🧪 Client received test response:", data);
      });

      // General event listener for debugging
      newSocket.onAny((eventName, ...args) => {
        console.log("🔍 Client received socket event:", eventName, args);
      });

      // Listen for real-time annotation events
      newSocket.on("annotationAdded", (data) => {
        console.log("📝 Client received annotationAdded event:", data);
        console.log("📝 Current reviewId:", params.reviewId);
        console.log("📝 Data projectId:", data.projectId);
        console.log("📝 Project ID match:", data.projectId === params.reviewId);

        if (data.projectId === params.reviewId) {
          console.log("📝 Adding new annotation to local state immediately");

          // Create new annotation object and add to local state immediately
          const newAnnotation = {
            id: Date.now().toString(),
            content: data.annotation,
            fileId: data.fileId,
            addedBy: data.addedBy || 'Unknown',
            addedByName: data.addedByName || 'Unknown',
            createdAt: data.timestamp,
            x: data.x,
            y: data.y,
            status: 'PENDING' as const,
            isResolved: false,
            replies: []
          };

          // Update annotations state immediately
          setAnnotations(prev => [...prev, newAnnotation]);

          // Update file annotations
          setFileAnnotations(prev => ({
            ...prev,
            [data.fileId]: [...(prev[data.fileId] || []), data.annotation]
          }));

          // Add to chat messages
          const senderName = data.addedByName || data.addedBy || 'Unknown';
          const isFromClient = senderName.includes('Client') || senderName === 'Client';
          const messageText = isFromClient
            ? `You sent: "${data.annotation}"`
            : `Received from ${senderName}: "${data.annotation}"`;

          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'annotation',
            message: messageText,
            timestamp: data.timestamp,
            addedBy: senderName,
            senderName: senderName,
            isFromClient: isFromClient
          }]);

          // Show visual notification for new annotation from admin
          if (!isFromClient) {
            const notification = {
              id: Date.now().toString(),
              type: 'annotation',
              title: 'New Annotation Added',
              message: `${senderName} added a new annotation: "${data.annotation}"`,
              timestamp: data.timestamp,
              fileId: data.fileId,
              x: data.x,
              y: data.y
            };
            setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep only last 10 notifications
          }

          setLastUpdate(data.timestamp);

          // Also refresh from server to ensure consistency
          setTimeout(() => {
            fetchAnnotations();
          }, 1000);
        } else {
          console.log("📝 Project ID mismatch, not refreshing");
        }
      });

      newSocket.on("annotationReplyAdded", (data) => {
        console.log("📝 Client received annotationReplyAdded event:", data);
        console.log("📝 Current reviewId:", params.reviewId);
        console.log("📝 Data projectId:", data.projectId);
        console.log("📝 Project ID match:", data.projectId === params.reviewId);

        if (data.projectId === params.reviewId) {
          console.log("📝 Adding new reply to local state immediately");

          // Update annotations state immediately with new reply
          setAnnotations(prev => prev.map(annotation =>
            annotation.id === data.annotationId
              ? {
                ...annotation,
                replies: [...(annotation.replies || []), {
                  id: Date.now().toString(),
                  content: data.reply?.content || data.reply,
                  addedBy: data.reply?.addedBy || data.addedBy || 'Unknown',
                  addedByName: data.reply?.addedByName || data.addedByName || 'Unknown',
                  createdAt: data.timestamp
                }]
              }
              : annotation
          ));

          // Add to chat messages
          const senderName = data.reply?.addedByName || data.addedByName || 'Unknown';
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'annotation',
            message: `Reply added by ${senderName}: ${data.reply?.content || data.reply}`,
            timestamp: data.timestamp,
            addedBy: data.reply?.addedBy || data.addedBy,
            senderName: senderName,
            isFromClient: data.reply?.addedBy === 'Client' || data.addedBy === 'Client'
          }]);
          setLastUpdate(data.timestamp);

          // Also refresh from server to ensure consistency
          setTimeout(() => {
            fetchAnnotations();
          }, 1000);
        } else {
          console.log("📝 Project ID mismatch for reply, not refreshing");
        }
      });

      // Listen for project status changes
      newSocket.on("projectStatusChanged", (data) => {
        console.log("📈 Client received projectStatusChanged event:", data);
        if (data.projectId === params.reviewId) {
          console.log("📈 Project status changed, refreshing page");
          // Refresh the page or update UI
          window.location.reload();
        }
      });

      // Listen for review status updates
      newSocket.on("reviewStatusUpdated", (data) => {
        console.log("📋 Client received reviewStatusUpdated event:", data);
        if (data.projectId === params.reviewId) {
          console.log("📋 Review status updated, refreshing page");
          // Add to chat messages
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'status',
            message: `Review status updated: ${data.status}`,
            timestamp: data.timestamp,
            addedBy: data.updatedBy,
            senderName: data.updatedByName || data.updatedBy || 'System',
            isFromClient: false
          }]);
          setLastUpdate(data.timestamp);
          // Refresh the page or update UI
          window.location.reload();
        }
      });

      // Listen for annotation status updates
      newSocket.on("annotationStatusUpdated", (data) => {
        console.log("📊 Client received annotationStatusUpdated event:", data);
        if (data.projectId === params.reviewId) {
          // Update local state immediately
          setAnnotations(prev => prev.map(annotation =>
            annotation.id === data.annotationId
              ? {
                ...annotation,
                status: data.status as any,
                isResolved: data.status === 'COMPLETED'
              }
              : annotation
          ));

          // Add to chat messages
          const senderName = data.updatedByName || data.updatedBy || 'Unknown';
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'status',
            message: `Annotation status changed to ${data.status} by ${senderName}`,
            timestamp: data.timestamp,
            addedBy: data.updatedBy,
            senderName: senderName,
            isFromClient: data.updatedBy === 'Client'
          }]);
          setLastUpdate(data.timestamp);
        }
      });

      // Listen for annotation assignments
      newSocket.on("annotationAssigned", (data) => {
        console.log("👤 Client received annotationAssigned event:", data);
        if (data.projectId === params.reviewId) {
          // Add to chat messages
          const senderName = data.assignedByName || data.assignedBy || 'Unknown';
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'status',
            message: `Annotation assigned to ${data.assignedTo} by ${senderName}`,
            timestamp: data.timestamp,
            addedBy: data.assignedBy,
            senderName: senderName,
            isFromClient: data.assignedBy === 'Client'
          }]);
          setLastUpdate(data.timestamp);
        }
      });

      // Listen for annotation resolved events
      newSocket.on("annotationResolved", (data) => {
        console.log("✅ Client received annotationResolved event:", data);
        if (data.projectId === params.reviewId) {
          // Update local state immediately
          setAnnotations(prev => prev.map(annotation =>
            annotation.id === data.annotationId
              ? {
                ...annotation,
                status: 'COMPLETED' as any,
                isResolved: true,
                resolvedBy: data.resolvedBy,
                resolvedAt: data.timestamp
              }
              : annotation
          ));

          // Add to chat messages
          const senderName = data.resolvedByName || data.resolvedBy || 'Unknown';
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'status',
            message: `Annotation resolved by ${senderName}`,
            timestamp: data.timestamp,
            addedBy: data.resolvedBy,
            senderName: senderName,
            isFromClient: data.resolvedBy === 'Client'
          }]);
          setLastUpdate(data.timestamp);
        }
      });

      // Listen for file uploads
      newSocket.on("fileUploaded", (data) => {
        console.log("📁 Client received fileUploaded event:", data);
        if (data.projectId === params.reviewId) {
          // Add to chat messages
          const senderName = data.uploadedByName || data.uploadedBy || 'Unknown';
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'status',
            message: `File uploaded: ${data.fileName} by ${senderName}`,
            timestamp: data.timestamp,
            addedBy: data.uploadedBy,
            senderName: senderName,
            isFromClient: data.uploadedBy === 'Client'
          }]);
          setLastUpdate(data.timestamp);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [params.reviewId]);

  // Additional room joining when reviewData is loaded (backup)
  useEffect(() => {
    if (socket && reviewData?.project?.id && reviewData.project.id !== params.reviewId) {
      console.log("🔗 Client joining additional project room:", reviewData.project.id);
      socket.emit("join-project", reviewData.project.id);
    }
  }, [socket, reviewData?.project?.id, params.reviewId]);

  // Helper functions
  const isImageFile = (file: ProjectFile) => {
    return file.type.startsWith("image/");
  };

  const openAnnotationModal = (file: ProjectFile) => {
    setSelectedImage(file);
    setShowAnnotationModal(true);
  };

  const addAnnotation = async () => {
    if (!newComment.trim() || !currentFileData) return;

    try {
      // Get current client info
      const currentClient = {
        name: reviewData?.project?.client?.name || "Client",
        role: "Client",
      };

      // Save to database
      const response = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          fileId: currentFileData.id,
          projectId: params.reviewId,
          addedBy: currentClient.role,
          addedByName: currentClient.name,
          coordinates: popupPosition,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        const newAnnotation: ProjectAnnotation = {
          id: data.data.id,
          content: newComment,
          fileId: currentFileData.id,
          addedBy: currentClient.role,
          addedByName: currentClient.name,
          createdAt: new Date().toISOString(),
          x: popupPosition?.x || 0,
          y: popupPosition?.y || 0,
          status: "PENDING",
          isResolved: false,
          replies: [],
        };

        // Add to annotations immediately
        setAnnotations((prev) => [...prev, newAnnotation]);

        // Update file annotations
        setFileAnnotations((prev) => ({
          ...prev,
          [currentFileData.id]: [
            ...(prev[currentFileData.id] || []),
            newComment,
          ],
        }));

        // Add to chat messages for real-time updates
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "annotation",
            message: `You added annotation: "${newComment}"`,
            timestamp: new Date().toISOString(),
            addedBy: currentClient.role,
            senderName: currentClient.name,
            isFromClient: true,
          },
        ]);

        // Emit to socket
        if (socket && params.reviewId) {
          console.log("🔌 Client emitting addAnnotation event:", {
            projectId: params.reviewId,
            fileId: currentFileData.id,
            annotation: newComment,
            addedBy: currentClient.role,
            addedByName: currentClient.name,
            x: popupPosition?.x,
            y: popupPosition?.y,
            timestamp: new Date().toISOString(),
          });
          socket.emit("addAnnotation", {
            projectId: params.reviewId,
            fileId: currentFileData.id,
            annotation: newComment,
            addedBy: currentClient.role,
            addedByName: currentClient.name,
            x: popupPosition?.x,
            y: popupPosition?.y,
            timestamp: new Date().toISOString(),
          });
        } else {
          console.log("🔌 Socket not available or projectId missing:", {
            socket: !!socket,
            projectId: params.reviewId,
          });
        }

        setNewComment("");
        setShowAnnotationPopup(false);
        setPopupPosition(null);
      } else {
        console.error("Failed to save annotation:", data.message);
        alert("Failed to save annotation. Please try again.");
      }
    } catch (error) {
      console.error("Error saving annotation:", error);
      alert("Failed to save annotation. Please try again.");
    }
  };

  // Handle annotation submission (for replies)
  const handleAnnotationSubmit = async () => {
    if (!selectedAnnotation || !newComment.trim()) return;

    try {
      // Add reply to annotation
      const response = await fetch("/api/annotations/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annotationId: selectedAnnotation.id,
          content: newComment,
          addedBy: "Client",
          addedByName: currentUser?.name || "Client",
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        // Update local state with new reply
        setAnnotations((prev) =>
          prev.map((annotation) =>
            annotation.id === selectedAnnotation.id
              ? {
                ...annotation,
                replies: [
                  ...(annotation.replies || []),
                  {
                    id: data.data.id,
                    content: newComment,
                    addedBy: "Client",
                    addedByName: currentUser?.name || "Client",
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
              : annotation
          )
        );

        // Add to chat messages for real-time updates
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "annotation",
            message: `You replied: "${newComment}"`,
            timestamp: new Date().toISOString(),
            addedBy: "Client",
            senderName: currentUser?.name || "Client",
            isFromClient: true,
          },
        ]);

        // Emit socket event for real-time updates
        if (socket) {
          console.log("🚀 Emitting addAnnotationReply socket event:", {
            projectId: params.reviewId,
            annotationId: selectedAnnotation.id,
            reply: newComment,
            addedBy: "Client",
            addedByName: currentUser?.name || "Client",
          });
          socket.emit("addAnnotationReply", {
            projectId: params.reviewId,
            annotationId: selectedAnnotation.id,
            reply: newComment,
            addedBy: "Client",
            addedByName: currentUser?.name || "Client",
            timestamp: new Date().toISOString(),
          });
        }

        setNewComment("");

        // Refresh annotations to show new reply
        fetchAnnotations();
      } else {
        console.error("Failed to add reply:", data.message);
        alert("Failed to add reply. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      alert("Failed to add reply. Please try again.");
    }
  };

  // Handle approval
  const handleApproval = async () => {
    try {
      const response = await fetch(`/api/projects/${params.reviewId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "approve",
          approvedBy: "Client",
          approvedByName: reviewData?.project?.client?.name || "Client",
          comments: "Approved by client",
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        // Update local state
        setReviewData((prev: any) => ({
          ...prev,
          status: "completed",
        }));

        // Emit socket event
        if (socket) {
          socket.emit("projectStatusChanged", {
            projectId: params.reviewId,
            status: "completed",
            updatedBy: "Client",
          });
        }

        alert("Project approved successfully!");
        setShowSignatureDialog(false);
      } else {
        console.error("Failed to approve project:", data.message);
        alert("Failed to approve project. Please try again.");
      }
    } catch (error) {
      console.error("Error approving project:", error);
      alert("Error approving project. Please try again.");
    }
  };

  // Handle revision request
  const handleRequestRevision = async () => {
    try {
      const response = await fetch(`/api/projects/${params.reviewId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reject",
          approvedBy: "Client",
          approvedByName: reviewData?.project?.client?.name || "Client",
          comments: revisionComments,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        // Update local state
        setReviewData((prev: any) => ({
          ...prev,
          status: "REJECTED",
        }));

        // Emit socket event
        if (socket) {
          socket.emit("projectStatusChanged", {
            projectId: params.reviewId,
            status: "REJECTED",
            updatedBy: "Client",
            comments: revisionComments,
          });
        }

        alert("Revision requested successfully!");
        setShowRevisionDialog(false);
        setRevisionComments("");
      } else {
        console.error("Failed to request revision:", data.message);
        alert("Failed to request revision. Please try again.");
      }
    } catch (error) {
      console.error("Error requesting revision:", error);
      alert("Error requesting revision. Please try again.");
    }
  };

  const removeAnnotation = (fileId: string, index: number) => {
    setFileAnnotations((prev) => ({
      ...prev,
      [fileId]: prev[fileId]?.filter((_, i) => i !== index) || [],
    }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading review...</p>
        </div>
      </div>
    );
  }
console.log(currentVersionData,'currentVersionData')
  // Error state
  if (error || !reviewData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Review Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            {error ||
              "The review you are looking for does not exist or you do not have access to it."}
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icons.ArrowLeft />
              <span className="ml-2">Back to Projects</span>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">
                {reviewData.reviewName || reviewData.project?.title}
              </h1>
              <p className="text-sm te xt-muted-foreground">
                Client Review Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">Client Access</Badge>
            <Badge
              variant={
                reviewData.status === "completed" ? "default" : "secondary"
              }
              className="capitalize"
            >
              {reviewData.status?.toLowerCase()}
            </Badge>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Live" : "Offline"}
            </Badge>
            {lastUpdate && (
              <Badge variant="outline" className="text-xs">
                Last update: {new Date(lastUpdate).toLocaleTimeString()}
              </Badge>
            )}
            <Badge variant="outline">{currentVersion}</Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
          {notifications.slice(0, 3).map((notification) => (
            <div
              key={notification.id}
              className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded-lg shadow-lg p-4 animate-in slide-in-from-right duration-300"
            >
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {notification.title}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {notification.message}
                  </p>
                  {notification.x !== undefined &&
                    notification.y !== undefined && (
                      <p className="text-xs text-gray-500">
                        Position: {notification.x.toFixed(1)}%,{" "}
                        {notification.y.toFixed(1)}%
                      </p>
                    )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.filter((n) => n.id !== notification.id)
                    );
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Design Review Section */}
            <div className="lg:col-span-2">
              {/* Version Control */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Version Control
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setShowVersionComparison(!showVersionComparison)
                        }
                      >
                        <Icons.Eye />
                        Compare Versions
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {versions.map((version) => (
                      <Button
                        key={version.id}
                        variant={
                          currentVersion === version.version
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => handleVersionChange(version.version)}
                        className="flex items-center gap-2"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(
                            version.status
                          )}`}
                        />
                        {version.version}
                        {/* <Badge variant="secondary" className="ml-1">
                          {getStatusText(version.status)}
                        </Badge> */}
                      </Button>
                    ))}
                  </div>

                  {showVersionComparison && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted">
                      <Label className="text-sm font-medium mb-2">
                        Compare with:
                      </Label>
                      <Select
                        value={compareVersion}
                        onValueChange={setCompareVersion}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select version to compare" />
                        </SelectTrigger>
                        <SelectContent>
                          {versions
                            .filter((v) => v.version !== currentVersion)
                            .map((version) => (
                              <SelectItem
                                key={version.id}
                                value={version.version}
                              >
                                {version.version} -{" "}
                                {getStatusText(version.status)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Version Comparison Display */}
                      {compareVersion && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(currentVersionData?.status || 'pending_review')}`} />
                              Current: {currentVersion}
                            </h4>
                            <div className="space-y-3">
                              {currentVersionData?.files.map((file: any) => (
                                <div key={file.id} className="border rounded-lg p-2">
                                  {file.type?.startsWith('image/') ? (
                                    <div className="space-y-2">
                                      <img
                                        src={file.url}
                                        alt={file.name}
                                        className="w-full h-32 object-cover rounded border"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling.style.display = 'flex';
                                        }}
                                      />
                                      <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded" style={{display: 'none'}}>
                                        <Icons.File className="h-4 w-4" />
                                        <span className="truncate">{file.name}</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                        <Icons.File className="h-4 w-4" />
                                      </div>
                                      <span className="truncate">{file.name}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {currentVersionData?.files.length === 0 && (
                                <p className="text-sm text-muted-foreground">No files in this version</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(versions.find(v => v.version === compareVersion)?.status || 'pending_review')}`} />
                              Comparing: {compareVersion}
                            </h4>
                            <div className="space-y-3">
                              {versions.find(v => v.version === compareVersion)?.files.map((file: any) => (
                                <div key={file.id} className="border rounded-lg p-2">
                                  {file.type?.startsWith('image/') ? (
                                    <div className="space-y-2">
                                      <img
                                        src={file.url}
                                        alt={file.name}
                                        className="w-full h-32 object-cover rounded border"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling.style.display = 'flex';
                                        }}
                                      />
                                      <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded" style={{display: 'none'}}>
                                        <Icons.File className="h-4 w-4" />
                                        <span className="truncate">{file.name}</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                        <Icons.File className="h-4 w-4" />
                                      </div>
                                      <span className="truncate">{file.name}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {versions.find(v => v.version === compareVersion)?.files.length === 0 && (
                                <p className="text-sm text-muted-foreground">No files in this version</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* File Selection */}
              {currentVersionData && currentVersionData.files.length > 1 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Select File to Review</CardTitle>
                    <CardDescription>
                      Choose which file to review and annotate
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentVersionData.files.map((file) => (
                        <div key={file.id} className="relative">
                          <Button
                            variant={
                              currentFile === file.id ? "default" : "outline"
                            }
                            className="h-auto p-4 justify-start w-full"
                            onClick={() => handleFileChange(file.id)}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                <Icons.FolderOpen />
                              </div>
                              <div className="text-left flex-1">
                                <p className="font-medium">
                                  {file.name.length > 5
                                    ? file.name.substring(0, 5) + "..."
                                    : file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                          </Button>
                          {isImageFile(file) && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="absolute top-2 right-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAnnotationModal(file);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Design Review */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Design Review -{" "}
                    {currentFileData?.name || "No file selected"}
                    <div className="flex gap-2">
                      <Badge variant={isConnected ? "default" : "secondary"}>
                        {isConnected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {currentVersionData?.status === 'completed' ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        This version has been completed. No further annotations can be added.
                      </div>
                    ) : (
                      "Click anywhere on the design to add annotations and feedback"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentFileData && isImageFile(currentFileData) ? (
                    <div className="relative bg-muted rounded-lg overflow-hidden">
                      <img
                        src={currentFileData.url}
                        alt={currentFileData.name}
                        className={`w-full h-auto max-h-[500px] object-contain ${currentVersionData?.status === 'completed' ? 'cursor-not-allowed' : 'cursor-crosshair'
                          }`}
                        onClick={(e) => {
                          if (currentVersionData?.status === 'completed') {
                            e.preventDefault();
                            return;
                          }
                          handleImageClick(e);
                        }}
                      />

                      {/* Render existing annotations on image */}
                      {currentFileAnnotations.map((annotation) => {
                        if (
                          annotation.x !== undefined &&
                          annotation.y !== undefined
                        ) {
                          return (
                            <div
                              key={annotation.id}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                              style={{
                                left: `${annotation.x}%`,
                                top: `${annotation.y}%`,
                              }}
                            >
                              {/* Main annotation pin */}
                              <div
                                className={`${annotation.isResolved
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                  } text-white text-xs px-2 py-1 rounded-full shadow-lg cursor-pointer hover:opacity-80 transition-colors group`}
                                onClick={() =>
                                  handleAnnotationClick(annotation)
                                }
                              >
                                <MapPin className="h-3 w-3 inline mr-1" />
                                {annotation.content.length > 15
                                  ? annotation.content.substring(0, 15) + "..."
                                  : annotation.content}
                                {annotation.replies &&
                                  annotation.replies.length > 0 && (
                                    <span className="ml-1 bg-white text-blue-500 rounded-full px-1 text-xs">
                                      {annotation.replies.length}
                                    </span>
                                  )}
                                {/* Status indicator */}
                                <div
                                  className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${annotation.isResolved
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                    } border-2 border-white`}
                                ></div>
                              </div>

                              {/* Hover popup with full content and replies */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none group-hover:pointer-events-auto">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[250px] max-w-[300px]">
                                  {/* Annotation header */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <div
                                      className={`w-2 h-2 rounded-full ${annotation.isResolved
                                          ? "bg-green-500"
                                          : "bg-red-500"
                                        }`}
                                    ></div>
                                    <span className="text-sm font-medium">
                                      {annotation.addedByName ||
                                        annotation.addedBy ||
                                        "Unknown"}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {annotation.createdAt
                                        ? new Date(annotation.createdAt).toLocaleString()
                                        : 'Invalid Date'}
                                    </span>
                                  </div>

                                  {/* Annotation content */}
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                    {annotation.content}
                                  </p>

                                  {/* Position info */}
                                  <p className="text-xs text-gray-500 mb-2">
                                    Position: {annotation.x?.toFixed(1) || 0}%,{" "}
                                    {annotation.y?.toFixed(1) || 0}%
                                  </p>

                                  {/* Show replies */}
                                  {annotation.replies &&
                                    annotation.replies.length > 0 && (
                                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                          Replies ({annotation.replies.length})
                                        </div>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                          {annotation.replies.map((reply) => (
                                            <div
                                              key={reply.id}
                                              className="bg-gray-50 dark:bg-gray-700 rounded p-2"
                                            >
                                              <div className="flex items-center gap-1 mb-1">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                <span className="text-xs font-medium">
                                                  {reply.addedByName ||
                                                    reply.addedBy}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                  {reply.createdAt
                                                    ? new Date(reply.createdAt).toLocaleString()
                                                    : 'Invalid Date'}
                                                </span>
                                              </div>
                                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                                {reply.content}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                  {/* Action buttons */}
                                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-6 px-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAnnotationClick(annotation);
                                      }}
                                      disabled={annotation.isResolved || currentVersionData?.status === 'completed'}
                                    >
                                      <MessageCircle className="h-3 w-3 mr-1" />
                                      Reply
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-6 px-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Handle view details
                                      }}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Show replies directly on image */}
                              {annotation.replies &&
                                annotation.replies.length > 0 && (
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 space-y-1">
                                    {annotation.replies
                                      .slice(0, 3)
                                      .map((reply, index) => (
                                        <div
                                          key={reply.id}
                                          className="bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg max-w-[200px]"
                                        >
                                          <div className="flex items-center gap-1">
                                            <MessageCircle className="h-2 w-2" />
                                            <span className="truncate">
                                              {reply.content}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    {annotation.replies.length > 3 && (
                                      <div className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                                        +{annotation.replies.length - 3} more
                                      </div>
                                    )}
                                  </div>
                                )}

                              {/* Reply button on hover */}
                              {currentVersionData?.status === 'pending' && (
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs bg-white border-blue-500 text-blue-500 hover:bg-blue-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAnnotationClick(annotation);
                                    }}
                                  >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    Reply
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })}

                      {/* Render real-time annotations on image */}
                      {realtimeAnnotations.map((annotation) => {
                        if (
                          annotation.x !== undefined &&
                          annotation.y !== undefined
                        ) {
                          return (
                            <div
                              key={`realtime-${annotation.id}`}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                              style={{
                                left: `${annotation.x}%`,
                                top: `${annotation.y}%`,
                              }}
                            >
                              {/* Main annotation pin */}
                              <div
                                className={`${annotation.resolved
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                  } text-white text-xs px-2 py-1 rounded-full shadow-lg cursor-pointer hover:opacity-80 transition-colors group`}
                                onClick={() =>
                                  handleAnnotationClick(annotation)
                                }
                              >
                                <MapPin className="h-3 w-3 inline mr-1" />
                                {annotation.comment.length > 15
                                  ? annotation.comment.substring(0, 15) + "..."
                                  : annotation.comment}
                                {/* Status indicator */}
                                <div
                                  className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${annotation.resolved
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                    } border-2 border-white`}
                                ></div>
                              </div>

                              {/* Hover popup for real-time annotations */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none group-hover:pointer-events-auto">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[250px] max-w-[300px]">
                                  {/* Annotation header */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <div
                                      className={`w-2 h-2 rounded-full ${annotation.resolved
                                          ? "bg-green-500"
                                          : "bg-red-500"
                                        }`}
                                    ></div>
                                    <span className="text-sm font-medium">
                                      {annotation.addedByName ||
                                        annotation.addedBy ||
                                        "Unknown"}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(
                                        annotation.timestamp
                                      ).toLocaleString()}
                                    </span>
                                  </div>

                                  {/* Annotation content */}
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                    {annotation.comment}
                                  </p>

                                  {/* Position info */}
                                  <p className="text-xs text-gray-500 mb-2">
                                    Position: {annotation.x?.toFixed(1) || 0}%,{" "}
                                    {annotation.y?.toFixed(1) || 0}%
                                  </p>

                                  {/* Action buttons */}
                                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-6 px-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAnnotationClick(annotation);
                                      }}
                                      disabled={annotation.resolved || currentVersionData?.status === 'completed'}
                                    >
                                      <MessageCircle className="h-3 w-3 mr-1" />
                                      Reply
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-6 px-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Handle view details
                                      }}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Reply button on hover */}
                              {currentVersionData?.status === 'pending' && (
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs bg-white border-blue-500 text-blue-500 hover:bg-blue-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAnnotationClick(annotation);
                                    }}
                                  >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    Reply
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })}

                      {/* Click to annotate badge */}
                      {currentVersionData?.status !== 'completed' && (
                        <div className="absolute top-4 left-4">
                          <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                              <MapPin className="h-3 w-3 mr-1" />
                              Click to annotate
                            </Badge>
                        </div>
                      )}

                      {/* Annotation counter badge */}
                      {(currentFileAnnotations.length > 0 ||
                        realtimeAnnotations.length > 0) && (
                          <div className="absolute top-4 right-4">
                            <Badge
                              variant="default"
                              className="text-xs bg-blue-500 text-white"
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {currentFileAnnotations.length +
                                realtimeAnnotations.length}{" "}
                              annotation
                              {currentFileAnnotations.length + realtimeAnnotations.length !==
                                1
                                ? "s"
                                : ""}
                            </Badge>
                          </div>
                        )}
                    </div>
                  ) : currentFileData ? (
                    <div className="relative bg-muted rounded-lg overflow-hidden border-2 border-border">
                      <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Icons.FolderOpen />
                          <p className="text-lg font-medium">
                            {currentFileData.name}
                          </p>
                          <p className="text-sm">
                            This file type cannot be annotated
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Icons.FolderOpen />
                        <p className="text-lg font-medium">No file selected</p>
                        <p className="text-sm">
                          Choose a file from the list above to start reviewing
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comments & Annotations */}
              {(realtimeComments.length > 0 ||
                realtimeAnnotations.length > 0 ||
                currentFileAnnotations.length > 0) && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Comments & Annotations (
                        {realtimeComments.length +
                          realtimeAnnotations.length +
                          currentFileAnnotations.length}
                        )
                      </CardTitle>
                      <CardDescription>
                        All feedback and annotations for this file
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Comments */}
                        {realtimeComments.map((comment) => (
                          <div key={comment.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-sm font-medium">
                                    {comment.userName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {comment.createdAt
                                      ? new Date(comment.createdAt).toLocaleString()
                                      : 'Invalid Date'}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.commentText}</p>
                                {comment.coordinates && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Position: {comment.coordinates}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Real-time Annotations */}
                        {realtimeAnnotations.map((annotation) => (
                          <div
                            key={annotation.id}
                            className="p-4 border rounded-lg"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className={`w-3 h-3 rounded-full ${annotation.resolved
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                      }`}
                                  />
                                  <span className="text-sm font-medium">
                                    {annotation.addedByName ||
                                      annotation.addedBy ||
                                      "Unknown"}
                                  </span>
                                  
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      annotation.timestamp
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm">{annotation.comment}</p>
                                 
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Regular Annotations */}
                        {currentFileAnnotations.map((annotation) => (
                          <div
                            key={annotation.id}
                            className="p-4 border rounded-lg"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className={`w-3 h-3 rounded-full ${annotation.isResolved
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                      }`}
                                  />
                                  <span className="text-sm font-medium">
                                    {annotation.addedByName ||
                                      annotation.addedBy ||
                                      "Unknown"}
                                  </span>
                                  
                                  <span className="text-xs text-muted-foreground">
                                    {annotation.createdAt
                                      ? new Date(annotation.createdAt).toLocaleString()
                                      : 'Date not available'}
                                  </span>
                                </div>
                                <p className="text-sm">{annotation.content}</p>
                               

                                {/* Show replies if any */}
                                {annotation.replies &&
                                  annotation.replies.length > 0 && (
                                    <div className="mt-3 ml-4 space-y-2">
                                      <div className="text-xs font-medium text-muted-foreground mb-2">
                                        Replies ({annotation.replies.length})
                                      </div>
                                      {annotation.replies.map((reply) => (
                                        <div
                                          key={reply.id}
                                          className="p-2 bg-gray-50 dark:bg-gray-800 rounded border-l-2 border-blue-500"
                                        >
                                          <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                            <span className="text-xs font-medium">
                                              {reply.addedByName || reply.addedBy}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              {new Date(
                                                reply.createdAt
                                              ).toLocaleString()}
                                            </span>
                                          </div>
                                          <p className="text-xs">
                                            {reply.content}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Revision History */}
              {revisions.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Revision History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {revisions.map((revision) => (
                        <div
                          key={revision.id}
                          className={`p-4 border rounded-lg ${revision.status === "completed"
                              ? "bg-green-50 border-green-200"
                              : revision.status === "rejected"
                                ? "bg-red-50 border-red-200"
                                : revision.status === "in_revision"
                                  ? "bg-yellow-50 border-yellow-200"
                                  : "bg-blue-50 border-blue-200"
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  variant={
                                    revision.status === "completed"
                                      ? "default"
                                      : revision.status === "rejected"
                                        ? "destructive"
                                        : revision.status === "in_revision"
                                          ? "secondary"
                                          : "outline"
                                  }
                                >
                                  {revision.version}
                                </Badge>
                                <Badge
                                  variant={
                                    revision.status === "completed"
                                      ? "default"
                                      : revision.status === "rejected"
                                        ? "destructive"
                                        : revision.status === "in_revision"
                                          ? "secondary"
                                          : "outline"
                                  }
                                >
                                  {getStatusText(revision.status)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Requested by {revision.requestedBy}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(
                                    revision.requestedAt
                                  ).toLocaleString("en-US", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-sm">{revision.comments}</p>
                              {revision.digitalSignature && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Digital Signature:{" "}
                                  {revision.digitalSignature.firstName}{" "}
                                  {revision.digitalSignature.lastName}
                                </p>
                              )}
                              {revision.completedAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Completed:{" "}
                                  {new Date(
                                    revision.completedAt
                                  ).toLocaleString("en-US", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Review Actions Sidebar */}
            <div className="space-y-6">
              {/* Project Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Project Name</Label>
                    <p className="text-sm text-muted-foreground">
                      {reviewData.project?.title || reviewData.reviewName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Client</Label>
                    <p className="text-sm text-muted-foreground">
                      {reviewData.project?.client?.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Current Version
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {currentVersion}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Current File</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentFileData?.name || "No file selected"}
                    </p>
                  </div>
                  {/* <div>
                    <Label className="text-sm font-medium">
                      Version Status
                    </Label>
                    <Badge
                      variant={
                        currentVersionData?.status === "completed"
                          ? "default"
                          : currentVersionData?.status === "rejected"
                            ? "destructive"
                            : currentVersionData?.status === "in_revision"
                              ? "secondary"
                              : "outline"
                      }
                    >
                      {getStatusText(currentVersionData?.status || "unknown")}
                    </Badge>
                  </div> */}
                  <div>
                    <Label className="text-sm font-medium">Review Status</Label>
                    <Badge
                      variant={
                        reviewData.status === "completed"
                          ? "default"
                          : reviewData.status === "REJECTED"
                            ? "destructive"
                            : reviewData.status === "IN_PROGRESS"
                              ? "secondary"
                              : "outline"
                      }
                    >
                      {reviewData.status?.toLowerCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {reviewData.createdAt ? 
                        new Date(reviewData.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          }
                        ) : 
                        "Date not available"
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Review Actions */}
              {currentVersionData?.status === "completed" ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Review Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-green-600">
                      <Icons.CheckCircle />
                      <p>This version has been approved</p>
                    </div>
                  </CardContent>
                </Card>
              ) : currentVersionData?.status === "rejected" ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Review Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-red-600">
                      <Icons.X />
                      <p>This version has been rejected</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Review Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => setShowSignatureDialog(true)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Icons.CheckCircle />
                      Approve {currentVersion}
                    </Button>

                    <Button
                      onClick={handleRejection}
                      variant="destructive"
                      className="w-full"
                    >
                      <Icons.X />
                      Request Changes
                    </Button>

                    {reviewData.allowDownloads && (
                      <Button variant="outline" className="w-full">
                        <Icons.Download />
                        Download Files
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}



              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Switch between versions using the version buttons</p>
                    <p>
                      • Select different files to review within each version
                    </p>
                    <p>
                      • Click "Add Annotation" to place annotations on specific
                      areas
                    </p>
                    <p>
                      • Use "Compare Versions" to see differences between
                      versions
                    </p>
                    <p>• Click on annotation pins to add or edit comments</p>
                    <p>• Use "Request Changes" to submit revision requests</p>
                    <p>• Approve only when you're satisfied with all changes</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar - Chat Messages */}
            {/* <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Live Chat
                    <Badge variant="outline" className="text-xs">
                      {chatMessages.length} messages
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Real-time communication with admin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {chatMessages.length > 0 ? (
                      chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${message.isFromClient
                              ? "bg-blue-50 dark:bg-blue-900/20 ml-4"
                              : "bg-gray-50 dark:bg-gray-800 mr-4"
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-2 h-2 rounded-full ${message.isFromClient
                                  ? "bg-blue-500"
                                  : "bg-gray-500"
                                }`}
                            ></div>
                            <span className="text-xs font-medium">
                              {message.senderName || message.addedBy || "Unknown"}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {message.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {message.timestamp
                                ? new Date(message.timestamp).toLocaleTimeString()
                                : 'Invalid Date'}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs">Start annotating to see live updates</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div> */}
          </div>
        </div>
      </main>

      {/* Request Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Please provide detailed feedback about what changes you'd like to
              see in the design.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Describe the changes you'd like to see..."
              value={revisionComments}
              onChange={(e) => setRevisionComments(e.target.value)}
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRevisionDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRequestRevision} variant="destructive">
              Submit Revision Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Digital Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Digital Signature Required</DialogTitle>
            <DialogDescription>
              Please enter your first and last name to approve this design. This
              serves as your digital signature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={digitalSignature.firstName}
                onChange={(e) =>
                  setDigitalSignature({
                    ...digitalSignature,
                    firstName: e.target.value,
                  })
                }
                placeholder="Enter your first name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={digitalSignature.lastName}
                onChange={(e) =>
                  setDigitalSignature({
                    ...digitalSignature,
                    lastName: e.target.value,
                  })
                }
                placeholder="Enter your last name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSignatureDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleApproval}>Continue to Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Confirmation Dialog */}
      <AlertDialog
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>
                  <strong>Important:</strong> By approving this design, you
                  confirm that:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>You have reviewed all annotations and comments</li>
                  <li>You are satisfied with the current design</li>
                  <li>You understand that production will begin immediately</li>
                  <li>Any changes after approval may incur additional fees</li>
                </ul>
                <p className="text-sm font-medium">
                  Digital Signature: {digitalSignature.firstName}{" "}
                  {digitalSignature.lastName}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApproval}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Annotation Popup */}
      {showAnnotationPopup && popupPosition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Add Annotation
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAnnotationPopup(false);
                  setPopupPosition(null);
                  setNewComment("");
                }}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Input Area */}
            <div className="p-4">
              <Input
                placeholder="Add annotation..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && newComment.trim()) {
                    addAnnotation();
                  }
                }}
                className="border-0 focus:ring-0 text-sm dark:bg-gray-800 dark:text-gray-100"
                autoFocus
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {/* Emoji Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    setNewComment((prev) => prev + "😊");
                  }}
                >
                  <span className="text-lg">😊</span>
                </Button>

                {/* Mention Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    setNewComment((prev) => prev + "@");
                  }}
                >
                  <span className="text-sm font-bold dark:text-gray-100">
                    @
                  </span>
                </Button>

                {/* Attachment Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.click();
                  }}
                >
                  <svg
                    className="h-4 w-4 dark:text-gray-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </Button>
              </div>

              {/* Submit Button */}
              <Button
                size="sm"
                onClick={addAnnotation}
                disabled={!newComment.trim()}
                className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-full"
              >
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Popup */}
      {showReplyPopup && selectedAnnotationForReply && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Reply to Annotation
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReplyPopup(false);
                  setSelectedAnnotationForReply(null);
                  setReplyText("");
                }}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Original Annotation */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${selectedAnnotationForReply.isResolved
                        ? "bg-green-500"
                        : "bg-red-500"
                      }`}
                  ></div>
                  <span className="text-sm font-medium">
                    {selectedAnnotationForReply.addedByName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedAnnotationForReply.createdAt
                      ? new Date(selectedAnnotationForReply.createdAt).toLocaleString()
                      : 'Invalid Date'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedAnnotationForReply.content}
                </p>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4">
              {selectedAnnotationForReply.status === 'COMPLETED' || selectedAnnotationForReply.status === 'REJECTED' ? (
                <div className="text-center py-4">
                  <div className={`mb-2 ${selectedAnnotationForReply.status === 'COMPLETED' ? 'text-green-500' : 'text-red-500'}`}>
                    <CheckCircle className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This annotation has been {selectedAnnotationForReply.status.toLowerCase()} and cannot be replied to.
                  </p>
                </div>
              ) : (
                <Input
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && replyText.trim()) {
                      handleReplySubmit();
                    }
                  }}
                  className="border-0 focus:ring-0 text-sm dark:bg-gray-800 dark:text-gray-100"
                  autoFocus
                />
              )}
            </div>

            {/* Action Bar */}
            {selectedAnnotationForReply.status === 'PENDING' && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {/* Emoji Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => {
                      setReplyText((prev) => prev + "😊");
                    }}
                  >
                    <span className="text-lg">😊</span>
                  </Button>

                  {/* Mention Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => {
                      setReplyText((prev) => prev + "@");
                    }}
                  >
                    <span className="text-sm font-bold dark:text-gray-100">
                      @
                    </span>
                  </Button>

                  {/* Attachment Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.click();
                    }}
                  >
                    <svg
                      className="h-4 w-4 dark:text-gray-100"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </Button>
                </div>

                {/* Submit Button */}
                <Button
                  size="sm"
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim()}
                  className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-full"
                >
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
