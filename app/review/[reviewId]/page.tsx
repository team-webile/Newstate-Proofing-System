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
import Lightbox from "@/components/Lightbox";
import {
  PenTool,
  X,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  MapPin,
  Eye,
  MessageSquare,
  ZoomIn,
} from "lucide-react";
// import ImageAnnotation from "@/components/ImageAnnotation"
import { useRealtimeComments } from "@/hooks/use-realtime-comments";
import { useUnifiedSocket } from '@/hooks/use-unified-socket';
import { useToast } from "@/hooks/use-toast";
// import { RealtimeImageAnnotation } from '@/components/RealtimeImageAnnotation';
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
  projectId?: string;
  addedBy: string;
  addedByName: string;
  createdAt: string;
  updatedAt?: string;
  x?: number;
  y?: number;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  isResolved: boolean;
  replies?: Array<{
    id: string;
    content: string;
    annotationId?: string;
    projectId?: string;
    addedBy: string;
    addedByName: string;
    createdAt: string;
    updatedAt?: string;
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
  status: "draft" | "pending_review" | "COMPLETED" | "rejected" | "in_revision";
  createdAt: string;
  annotations: ProjectAnnotation[];
  revisionNotes?: string;
}

interface Revision {
  id: string;
  version: string;
  status: "in_revision" | "pending_review" | "COMPLETED" | "rejected";
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
  const { toast } = useToast();
  const [annotations, setAnnotations] = useState<ProjectAnnotation[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [fileAnnotations, setFileAnnotations] = useState<{
    [key: string]: string[];
  }>({});
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProjectFile | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  // Socket is handled by useRealtimeComments hook
  // File-specific chat messages - organized by fileId
  const [chatMessages, setChatMessages] = useState<{
    [fileId: string]: Array<{
      id: string;
      type: "annotation" | "status";
      message: string;
      timestamp: string;
      createdAt?: string;
      addedBy?: string;
      senderName?: string;
      isFromClient?: boolean;
    }>
  }>({});

  // Helper function to get current file's chat messages
  const getCurrentFileChatMessages = () => {
    if (!selectedImage?.id) return [];
    return chatMessages[selectedImage.id] || [];
  };

  // Helper function to add message to current file
  const addMessageToCurrentFile = (message: any) => {
    if (!selectedImage?.id) return;
    setChatMessages(prev => ({
      ...prev,
      [selectedImage.id]: [...(prev[selectedImage.id] || []), message]
    }));
  };

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
  const [showAnnotationChat, setShowAnnotationChat] = useState(false);
  const [selectedAnnotationChat, setSelectedAnnotationChat] = useState<ProjectAnnotation | null>(null);
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
    projectId: params.reviewId, // Use the reviewId directly as projectId
    elementId: currentFile, // Use currentFile instead of currentFileData?.id
    fileId: currentFile, // Use currentFile instead of currentFileData?.id
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

  // Debounce mechanism for API calls
  const [fetchTimeout, setFetchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFetchingAnnotations, setIsFetchingAnnotations] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  // Fetch annotations with debouncing
  const fetchAnnotations = async (force = false) => {
    // Clear existing timeout
    if (fetchTimeout) {
      clearTimeout(fetchTimeout);
    }

    // If not forced, debounce the call
    if (!force) {
      const timeout = setTimeout(async () => {
        await performFetchAnnotations();
      }, 500); // 500ms debounce
      setFetchTimeout(timeout);
      return;
    }

    // If forced, fetch immediately
    await performFetchAnnotations();
  };
console.log(reviewData,'reviewData')
  const performFetchAnnotations = async () => {
    // Prevent multiple simultaneous requests
    if (isFetchingAnnotations) {
      console.log('🔄 Already fetching annotations, skipping...');
      return;
    }

    try {
      setIsFetchingAnnotations(true);
      console.log('🔄 Fetching annotations for project:', params.reviewId);
      const response = await fetch(
        `/api/annotations?projectId=${params.reviewId}`
      );
      const data = await response.json();

      if (data.status === "success") {
        console.log('🔍 Raw API data:', data.data);
        console.log('🔍 First annotation raw data:', data.data[0]);
        console.log('🔍 First annotation replies:', data.data[0]?.replies);

        // Transform annotations to ensure x, y coordinates are properly set
        const transformedAnnotations = data.data.map((annotation: any): ProjectAnnotation => {
          // Parse coordinates if they exist
          let x = annotation.x;
          let y = annotation.y;
          if (!x && !y && annotation.coordinates) {
            try {
              const coords = JSON.parse(annotation.coordinates);
              x = coords.x;
              y = coords.y;
            } catch (e) {
              console.error("Error parsing coordinates:", e);
            }
          }

          return {
            id: annotation.id,
            content: annotation.content,
            fileId: annotation.fileId,
            projectId: annotation.projectId,
            addedBy: annotation.addedBy,
            addedByName: annotation.addedByName,
            isResolved: annotation.isResolved,
            status: annotation.status,
            createdAt: annotation.createdAt,
            updatedAt: annotation.updatedAt,
            x: x,
            y: y,
            replies: (() => {
              console.log(`🔍 Processing replies for annotation ${annotation.id}:`, annotation.replies);
              const processedReplies = annotation.replies?.map((reply: any) => ({
                id: reply.id,
                content: reply.content,
                annotationId: reply.annotationId,
                projectId: reply.projectId,
                addedBy: reply.addedBy,
                addedByName: reply.addedByName,
                createdAt: reply.createdAt,
                updatedAt: reply.updatedAt
              })) || [];
              console.log(`🔍 Processed replies for annotation ${annotation.id}:`, processedReplies);
              return processedReplies;
            })()
          };
        });

        // Update the main annotations state
        setAnnotations(transformedAnnotations);

        // Group annotations by fileId
        const annotationsByFile = transformedAnnotations.reduce((acc: { [key: string]: any[] }, annotation: ProjectAnnotation) => {
          if (!acc[annotation.fileId]) {
            acc[annotation.fileId] = [];
          }
          acc[annotation.fileId].push(annotation);
          return acc;
        }, {});

        setFileAnnotations(annotationsByFile);

      } else {
        console.error("Failed to fetch annotations:", data.message);
      }
    } catch (error) {
      console.error("Error fetching annotations:", error);
    } finally {
      setIsFetchingAnnotations(false);
    }
  };

  useEffect(() => {
    fetchReviewData();
    fetchAnnotations();

    // Cleanup timeout on unmount
    return () => {
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
    };
  }, [params.reviewId]);

  useEffect(() => {
    if (currentVersionData?.files.length && !currentFile) {
      setCurrentFile(currentVersionData.files[0].id);
    }
  }, [currentVersionData, currentFile]);

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!currentFileData) return;

    // Don't allow adding annotations if status is completed or rejected
    if (reviewData.status === "COMPLETED" || reviewData.status === "REJECTED") {
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

  const handleLightboxOpen = (imageUrl: string, allImages?: string[]) => {
    if (allImages && allImages.length > 0) {
      setLightboxImages(allImages);
      setLightboxIndex(allImages.indexOf(imageUrl));
    } else {
      setLightboxImages([imageUrl]);
      setLightboxIndex(0);
    }
    setShowLightbox(true);
  };

  // Check if all annotations are completed or rejected
  const areAllAnnotationsResolved = () => {
    return currentFileAnnotations.every(annotation =>
      annotation.status === "COMPLETED" || annotation.status === "REJECTED"
    );
  };

  const handleAnnotationClick = (annotation: any) => {
    // Don't allow replies to completed or rejected annotations
    if (annotation.status === "COMPLETED" || annotation.status === "REJECTED") {
      return;
    }

    setSelectedAnnotationForReply(annotation);
    setShowReplyPopup(true);
    setReplyText("");
  };

  const handleAnnotationChatClick = async (annotation: ProjectAnnotation) => {
    console.log('🔍 Opening annotation chat with data:', annotation);
    console.log('🔍 Replies data:', annotation.replies);
    console.log('🔍 Replies length:', annotation.replies?.length || 0);
    console.log('🔍 Replies type:', typeof annotation.replies);
    console.log('🔍 Full annotation object:', JSON.stringify(annotation, null, 2));

    // Only refresh if we don't have replies or if the annotation is very old
    const shouldRefresh = !annotation.replies || annotation.replies.length === 0 ||
      (annotation.createdAt && new Date(annotation.createdAt) < new Date(Date.now() - 5 * 60 * 1000)); // 5 minutes old

    if (shouldRefresh) {
      try {
        console.log('🔄 Refreshing annotations for chat...');
        await fetchAnnotations();
      } catch (error) {
        console.error('Error refreshing annotations:', error);
      }
    }

    // Find the updated annotation with latest replies
    const updatedAnnotation = annotations.find(a => a.id === annotation.id) || annotation;

    // Ensure we have the required fields and properly handle replies
    const chatAnnotation = {
      ...updatedAnnotation,
      content: updatedAnnotation.content || 'No content',
      addedBy: updatedAnnotation.addedBy || 'Unknown',
      addedByName: updatedAnnotation.addedByName || updatedAnnotation.addedBy || 'Unknown',
      createdAt: updatedAnnotation.createdAt || new Date().toISOString(),
      replies: Array.isArray(updatedAnnotation.replies) ? updatedAnnotation.replies : []
    };

    console.log('🔍 Processed chat annotation:', chatAnnotation);
    console.log('🔍 Processed replies:', chatAnnotation.replies);
    console.log('🔍 Processed replies length:', chatAnnotation.replies.length);
    setSelectedAnnotationChat(chatAnnotation);
    setShowAnnotationChat(true);

    // Auto-scroll to bottom when opening chat
    setTimeout(() => {
      scrollToBottom();
    }, 200);
  };

  const handleCloseAnnotationChat = () => {
    setShowAnnotationChat(false);
    setSelectedAnnotationChat(null);
  };

  const handleReplySubmit = async () => {
    // Use selectedAnnotationChat for the new chat popup, fallback to selectedAnnotationForReply for legacy popup
    const targetAnnotation = selectedAnnotationChat || selectedAnnotationForReply;

    if (!targetAnnotation || !replyText.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      const response = await fetch("/api/annotations/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annotationId: targetAnnotation.id,
          content: replyText,
          addedBy: "Client",
          addedByName: currentUser?.name || "Client",
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        // Update local state with new reply (no need to fetch again)
        setAnnotations((prev) =>
          prev.map((annotation) =>
            annotation.id === targetAnnotation.id
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

        // Update selectedAnnotationChat if it exists
        if (selectedAnnotationChat) {
          console.log('🔄 Updating selectedAnnotationChat with new reply:', replyText);
          setSelectedAnnotationChat((prev) => {
            if (!prev) return prev;
            const updatedChat = {
              ...prev,
              replies: [
                ...(prev.replies || []),
                {
                  id: data.data.id,
                  content: replyText,
                  addedBy: "Client",
                  addedByName: currentUser?.name || "Client",
                  createdAt: new Date().toISOString(),
                },
              ],
            };
            console.log('🔄 Updated selectedAnnotationChat:', updatedChat);
            return updatedChat;
          });

          // Auto-scroll to bottom after adding new reply
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }

        // Add to chat messages for real-time updates (only if not already added)
        if (selectedImage?.id) {
          const messageId = `reply-${data.data.id}`;
          const currentMessages = getCurrentFileChatMessages();
          const existingMessage = currentMessages.find(msg => msg.id === messageId);
          if (!existingMessage) {
            addMessageToCurrentFile({
              id: messageId,
              type: "annotation",
              message: `You replied: "${replyText}"`,
              timestamp: new Date().toISOString(),
              addedBy: "Client",
              senderName: currentUser?.name || "Client",
              isFromClient: true,
            });
          }
        }

        // Success feedback
        toast({
          title: "Success",
          description: "Reply added successfully!",
          variant: "default",
        });

        // Close only the legacy reply popup, keep chat popup open
        if (selectedAnnotationForReply) {
          setShowReplyPopup(false);
          setSelectedAnnotationForReply(null);
        }
        // Keep chat popup open to show the updated conversation
      } else {
        console.error("Failed to add reply:", data.message);
        toast({
          title: "Error",
          description: "Failed to add reply. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast({
        title: "Error",
        description: "Failed to add reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReply(false);
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
          status: "COMPLETED" as const,
          digitalSignature: digitalSignature,
          completedAt: new Date().toISOString(),
        }
        : r
    );
    setRevisions(updatedRevisions);

    // Update version status
    const updatedVersions = versions.map((v) =>
      v.version === currentVersion ? { ...v, status: "COMPLETED" as const } : v
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
      case "COMPLETED":
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
      case "COMPLETED":
        return "COMPLETED";
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

  // Filter realtime annotations by current file
  const currentFileRealtimeAnnotations = realtimeAnnotations.filter(
    (a) => a.fileId === currentFile
  );

  // Initialize unified socket
  const {
    isConnected: socketConnected,
    emitAnnotation,
    emitAnnotationReply,
    emitAnnotationStatusChange,
    emitReviewStatusChange,
    emitProjectStatusChange
  } = useUnifiedSocket({
    projectId: params.reviewId,
    events: {
      onAnnotationAdded: (data) => {
        console.log('🔔 Client received annotationAdded event:', data);
        const newAnnotation: ProjectAnnotation = {
          id: data.id || Date.now().toString(), // Use database ID if available
          content: data.annotation || data.content,
          fileId: data.fileId,
          addedBy: data.addedBy || 'Unknown',
          addedByName: data.addedByName || 'Unknown',
          createdAt: data.timestamp,
          status: 'PENDING',
          isResolved: false,
          x: data.x,
          y: data.y,
          replies: []
        };

        setAnnotations(prev => [...prev, newAnnotation]);
        setLastUpdate(data.timestamp);

        // Add to chat messages
        const senderName = data.addedByName || data.addedBy || 'Unknown';
        const isFromClient = senderName.includes('Client') || senderName === 'Client';
        const messageText = isFromClient
          ? `You sent: "${data.annotation || data.content}"`
          : `Received from ${senderName}: "${data.annotation || data.content}"`;

        // Only add message if it's for the current file
        if (data.fileId === selectedImage?.id) {
          addMessageToCurrentFile({
            id: Date.now().toString(),
            type: 'annotation',
            message: messageText,
            timestamp: data.timestamp,
            addedBy: senderName,
            senderName: senderName,
            isFromClient: isFromClient
          });
        }

        // Show visual notification for new annotation from admin
        if (!isFromClient) {
          const notification = {
            id: Date.now().toString(),
            type: 'annotation',
            title: 'New Annotation Added',
            message: `${senderName} added a new annotation: "${data.annotation || data.content}"`,
            timestamp: data.timestamp,
            fileId: data.fileId,
            x: data.x,
            y: data.y
          };
          setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        }
      },
      onAnnotationReplyAdded: (data) => {
        console.log('🔔 Client received annotation reply via socket:', data);

        // Handle different data structures
        let newReply;
        if (data.reply && typeof data.reply === 'object') {
          newReply = {
            id: data.reply.id || Date.now().toString(),
            content: data.reply.content || 'Reply content',
            addedBy: data.reply.addedBy || 'Unknown',
            addedByName: data.reply.addedByName || 'Unknown',
            createdAt: data.reply.createdAt || new Date().toISOString()
          };
        } else {
          newReply = {
            id: Date.now().toString(),
            content: data.reply || 'Reply content',
            addedBy: data.addedBy || 'Unknown',
            addedByName: data.addedByName || 'Unknown',
            createdAt: data.timestamp || new Date().toISOString()
          };
        }

        // Update annotations array
        setAnnotations(prev => prev.map(annotation =>
          annotation.id === data.annotationId
            ? {
              ...annotation,
              replies: [...(annotation.replies || []), newReply]
            }
            : annotation
        ));

        // Update selectedAnnotationChat if it's the same annotation AND not from current client
        const isFromCurrentClient = newReply.addedBy === 'Client' || newReply.addedByName === 'Client';
        if (selectedAnnotationChat && selectedAnnotationChat.id === data.annotationId && !isFromCurrentClient) {
          setSelectedAnnotationChat(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              replies: [...(prev.replies || []), newReply]
            };
          });

          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }

        // Add to chat messages
        const senderName = newReply.addedByName || newReply.addedBy || 'Unknown';
        const messageId = `socket-reply-${newReply.id}`;
        const currentMessages = getCurrentFileChatMessages();
        const existingMessage = currentMessages.find(msg => msg.id === messageId);
        if (!existingMessage) {
          addMessageToCurrentFile({
            id: messageId,
            type: 'annotation',
            message: `Reply added by ${senderName}: ${newReply.content}`,
            timestamp: data.timestamp || newReply.createdAt,
            addedBy: newReply.addedBy,
            senderName: senderName,
            isFromClient: newReply.addedBy === 'Client'
          });
        }
        setLastUpdate(data.timestamp);
      },
      onAnnotationStatusUpdated: (data) => {
        setAnnotations(prev => prev.map(annotation =>
          annotation.id === data.annotationId
            ? {
              ...annotation,
              status: data.status as any,
              isResolved: data.status === "COMPLETED"
            }
            : annotation
        ));

        const senderName = data.updatedByName || data.updatedBy || 'Unknown';
        addMessageToCurrentFile({
          id: Date.now().toString(),
          type: 'status',
          message: `Annotation status changed to ${data.status} by ${senderName}`,
          timestamp: data.timestamp,
          addedBy: data.updatedBy,
          senderName: senderName,
          isFromClient: data.updatedBy === 'Client'
        });
        setLastUpdate(data.timestamp);
      },
      onReviewStatusUpdated: (data) => {
        console.log('🔔 Client received reviewStatusUpdated event:', data);
        
        // Update project status if review status affects it
        if (data.status === 'APPROVED' || data.status === 'REJECTED') {
          // Update review data status
          setReviewData((prev: any) => prev ? { 
            ...prev, 
            status: data.status === 'APPROVED' ? 'COMPLETED' : 'REJECTED' as any 
          } : prev);
        }
        
        const senderName = data.updatedByName || data.updatedBy || 'Unknown';
        addMessageToCurrentFile({
          id: Date.now().toString(),
          type: 'status',
          message: `Review status changed to ${data.status} by ${senderName}`,
          timestamp: data.timestamp,
          addedBy: data.updatedBy,
          senderName: senderName,
          isFromClient: data.updatedBy === 'Client'
        });
        setLastUpdate(data.timestamp);
      },
      onProjectStatusChanged: (data) => {
        setReviewData((prev: any) => prev ? { ...prev, status: data.status as any } : prev);
        
        const senderName = data.changedByName || data.changedBy || 'Unknown';
        addMessageToCurrentFile({
          id: Date.now().toString(),
          type: 'status',
          message: `Project status changed to ${data.status} by ${senderName}`,
          timestamp: data.timestamp,
          addedBy: data.changedBy,
          senderName: senderName,
          isFromClient: data.changedBy === 'Client'
        });
        setLastUpdate(data.timestamp);
      }
    }
  });

  // Update selectedAnnotationChat when annotations are updated (only for non-client messages)
  useEffect(() => {
    if (selectedAnnotationChat && annotations.length > 0) {
      const updatedAnnotation = annotations.find(a => a.id === selectedAnnotationChat.id);
      if (updatedAnnotation && updatedAnnotation.replies) {
        // Check if the latest reply is from current client - if so, don't update to prevent duplicates
        const latestReply = updatedAnnotation.replies[updatedAnnotation.replies.length - 1];
        const isLatestFromCurrentClient = latestReply?.addedBy === 'Client' || latestReply?.addedByName === 'Client';

        if (!isLatestFromCurrentClient) {
          console.log('🔄 Updating selectedAnnotationChat with new replies from other users:', updatedAnnotation.replies);
          setSelectedAnnotationChat(prev => ({
            ...prev!,
            replies: updatedAnnotation.replies || []
          }));
        } else {
          console.log('🔄 Skipping selectedAnnotationChat update - latest reply is from current client');
        }
      }
    }
  }, [annotations]);

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
        name: reviewData?.project?.client?.firstName + " " + reviewData?.project?.client?.lastName || "Client",
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
        addMessageToCurrentFile({
          id: Date.now().toString(),
          type: "annotation",
          message: `You added annotation: "${newComment}"`,
          timestamp: new Date().toISOString(),
          addedBy: currentClient.role,
          senderName: currentClient.name,
          isFromClient: true,
        });

        // Emit to socket
        emitAnnotation({
          projectId: params.reviewId,
          fileId: currentFileData.id,
          annotation: newComment,
          addedBy: currentClient.role,
          addedByName: currentClient.name,
          x: popupPosition?.x,
          y: popupPosition?.y,
          timestamp: new Date().toISOString(),
        });

        setNewComment("");
        setShowAnnotationPopup(false);
        setPopupPosition(null);
        
        toast({
          title: "Success",
          description: "Annotation added successfully!",
          variant: "default",
        });
      } else {
        console.error("Failed to save annotation:", data.message);
        toast({
          title: "Error",
          description: "Failed to save annotation. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving annotation:", error);
      toast({
        title: "Error",
        description: "Failed to save annotation. Please try again.",
        variant: "destructive",
      });
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
        addMessageToCurrentFile({
          id: Date.now().toString(),
          type: "annotation",
          message: `You replied: "${newComment}"`,
          timestamp: new Date().toISOString(),
          addedBy: "Client",
          senderName: currentUser?.name || "Client",
          isFromClient: true,
        });

        // Emit socket event for real-time updates
        emitAnnotationReply({
          projectId: params.reviewId,
          annotationId: selectedAnnotation.id,
          reply: newComment,
          addedBy: "Client",
          addedByName: currentUser?.name || "Client",
          timestamp: new Date().toISOString(),
        });

        setNewComment("");

        // Refresh annotations to show new reply
        fetchAnnotations();
      } else {
        console.error("Failed to add reply:", data.message);
        toast({
          title: "Error",
          description: "Failed to add reply. Please try again.",
          variant: "destructive",
        });
        setShowAnnotationChat(false);
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast({
        title: "Error",
        description: "Failed to add reply. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle approval
  const handleApproval = async () => {
    setIsApproving(true);
    try {
      // Validate digital signature
      const clientName = `${reviewData?.project?.client?.firstName} ${reviewData?.project?.client?.lastName}`;
      const signatureName = `${digitalSignature.firstName} ${digitalSignature.lastName}`;
      
      if (clientName.toLowerCase().trim() !== signatureName.toLowerCase().trim()) {
        toast({
          title: "Signature Mismatch",
          description: "Digital signature name does not match the client name. Please check your name and try again.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/projects/${params.reviewId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "approve",
          approvedBy: "Client",
          approvedByName: signatureName,
          comments: "Approved by client",
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        // Update local state
        setReviewData((prev: any) => ({
          ...prev,
          status: "COMPLETED",
        }));

        // Emit socket event
        emitProjectStatusChange({
          projectId: params.reviewId,
          status: "COMPLETED",
          updatedBy: "Client",
        });

        toast({
          title: "Success",
          description: "Project approved successfully!",
          variant: "default",
        });
        setShowSignatureDialog(false);
      } else {
        console.error("Failed to approve project:", data.message);
        toast({
          title: "Error",
          description: "Failed to approve project. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error approving project:", error);
      toast({
        title: "Error",
        description: "Error approving project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  // Handle revision request
  const handleRequestRevision = async () => {
    setIsRejecting(true);
    try {
      // Validate digital signature for rejection as well
      const clientName = `${reviewData?.project?.client?.firstName} ${reviewData?.project?.client?.lastName}`;
      const signatureName = `${digitalSignature.firstName} ${digitalSignature.lastName}`;
      
      if (clientName.toLowerCase().trim() !== signatureName.toLowerCase().trim()) {
        toast({
          title: "Signature Mismatch",
          description: "Digital signature name does not match the client name. Please check your name and try again.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/projects/${params.reviewId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reject",
          approvedBy: "Client",
          approvedByName: signatureName,
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
        emitProjectStatusChange({
          projectId: params.reviewId,
          status: "REJECTED",
          updatedBy: "Client",
          comments: revisionComments,
        });

        toast({
          title: "Success",
          description: "Revision requested successfully!",
          variant: "default",
        });
        setShowRevisionDialog(false);
        setRevisionComments("");
      } else {
        console.error("Failed to request revision:", data.message);
        toast({
          title: "Error",
          description: "Failed to request revision. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting revision:", error);
      toast({
        title: "Error",
        description: "Error requesting revision. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
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
              <p className="text-sm text-muted-foreground">
                Client Review Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">Client Access</Badge>
            <Badge
              variant={
                reviewData.status === "COMPLETED" ? "default" : "secondary"
              }
              className="capitalize"
            >
              {reviewData.status?.toLowerCase()}
            </Badge>
            <Badge variant={socketConnected ? "default" : "secondary"}>
              {socketConnected ? "Live" : "Offline"}
            </Badge>
            {lastUpdate && (
              <Badge variant="outline" className="text-xs">
                Last update: {new Date(lastUpdate).toLocaleTimeString()}
              </Badge>
            )}
            <Badge variant="outline">{currentVersion}</Badge>
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
                  {/* {notification.x !== undefined &&
                    notification.y !== undefined && (
                      <p className="text-xs text-gray-500">
                        Position: {notification.x.toFixed(1)}%,{" "}
                        {notification.y.toFixed(1)}%
                      </p>
                    )} */}
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
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(reviewData.status || 'pending_review')}`} />
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
                                        className="w-full h-32 object-cover rounded border cursor-zoom-in"
                                        onClick={() => {
                                          const allImages = currentVersionData?.files
                                            ?.filter((f: any) => f.type?.startsWith('image/'))
                                            ?.map((f: any) => f.url) || [];
                                          handleLightboxOpen(file.url, allImages);
                                        }}
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                          if (nextElement) {
                                            nextElement.style.display = 'flex';
                                          }
                                        }}
                                      />
                                      <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded" style={{ display: 'none' }}>
                                        <Icons.File />
                                        <span className="truncate">{file.name}</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                        <Icons.File />
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
                                        className="w-full h-32 object-cover rounded border cursor-zoom-in"
                                        onClick={() => {
                                          const compareVersionData = versions.find(v => v.version === compareVersion);
                                          const allImages = compareVersionData?.files
                                            ?.filter((f: any) => f.type?.startsWith('image/'))
                                            ?.map((f: any) => f.url) || [];
                                          handleLightboxOpen(file.url, allImages);
                                        }}
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                          if (nextElement) {
                                            nextElement.style.display = 'flex';
                                          }
                                        }}
                                      />
                                      <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded" style={{ display: 'none' }}>
                                        <Icons.File />
                                        <span className="truncate">{file.name}</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                        <Icons.File />
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
                              <div className={`w-8 h-8 rounded flex items-center justify-center ${
                                currentFile === file.id ? "bg-primar" : "bg-muted"
                              }`}>
                                <Icons.Image  style={{MarginLeft: '10px'}}/>
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
                      <Badge variant={socketConnected ? "default" : "secondary"}>
                        {socketConnected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {reviewData.status === "COMPLETED" ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        This version has been completed. No further annotations can be added.
                      </div>
                    ) : reviewData.status === "REJECTED" ? (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        This version has been rejected. No further annotations can be added.
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
                        className={`w-full h-auto max-h-[500px] object-contain ${(reviewData.status === "COMPLETED" || reviewData.status === "REJECTED") ? 'cursor-zoom-in' : 'cursor-crosshair'
                          }`}
                        onClick={(e) => {
                          if (reviewData.status === "COMPLETED" || reviewData.status === "REJECTED") {
                            // Open lightbox for completed/rejected reviews
                            const allImages = currentVersionData?.files
                              ?.filter((file: any) => isImageFile(file))
                              ?.map((file: any) => file.url) || [];
                            handleLightboxOpen(currentFileData.url, allImages);
                            return;
                          }
                          handleImageClick(e);
                        }}
                      />

                      {/* Lightbox trigger overlay for completed/rejected reviews */}
                      {(reviewData.status === "COMPLETED" || reviewData.status === "REJECTED") && (
                        <div className="absolute top-10 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-black/80 transition-colors"
                             onClick={(e) => {
                               e.stopPropagation();
                               const allImages = currentVersionData?.files
                                 ?.filter((file: any) => isImageFile(file))
                                 ?.map((file: any) => file.url) || [];
                               handleLightboxOpen(currentFileData.url, allImages);
                             }}>
                          <div className="flex items-center gap-1">
                            <ZoomIn className="h-4 w-4" />
                            <span>Click to zoom</span>
                          </div>
                        </div>
                      )}

                      {/* Render existing annotations on image */}
                      {currentFileAnnotations.map((annotation) => {
                        if (
                          annotation.x !== undefined &&
                          annotation.y !== undefined
                        ) {
                          const hasReplies = annotation.replies && annotation.replies.length > 0
                          const isOriginalMessage = !annotation.replies || annotation.replies.length === 0

                          return (
                            <div
                              key={annotation.id}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                              style={{
                                left: `${annotation.x}%`,
                                top: `${annotation.y}%`,
                              }}
                            >
                              {/* Main annotation pin with blinking effect for original messages */}
                              <div
                                className={`${annotation.isResolved
                                  ? "bg-green-500"
                                  : "bg-red-500"
                                  } text-white text-xs px-3 py-2 rounded-full shadow-lg cursor-pointer hover:opacity-90 transition-all duration-300 group ${isOriginalMessage ? 'animate-pulse ring-2 ring-white ring-opacity-50' : ''
                                  }`}
                                onClick={() =>
                                  handleAnnotationChatClick(annotation)
                                }
                              >
                                {/* Original message indicator */}
                                {isOriginalMessage && (
                                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white animate-bounce">
                                    <div className="w-full h-full bg-orange-400 rounded-full animate-ping"></div>
                                  </div>
                                )}

                                <MapPin className="h-3 w-3 inline mr-1" />

                                {/* Message content */}
                                <span className="font-medium">
                                  {typeof annotation.content === 'string' && annotation.content.length > 12 ? annotation.content.substring(0, 12) + '...' : (typeof annotation.content === 'string' ? annotation.content : 'Annotation')}
                                </span>

                                {/* Reply count badge */}
                                {hasReplies && (
                                  <span className="ml-1 bg-white text-blue-600 rounded-full px-1.5 py-0.5 text-xs font-bold">
                                    {annotation.replies?.length || 0}
                                  </span>
                                )}

                                {/* Status indicator */}
                                <div
                                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${annotation.isResolved
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                    } border-2 border-white`}
                                ></div>
                              </div>

                              {/* Quick action tooltip */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                <div className="bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                  {isOriginalMessage ? 'Original Message' : 'View Conversation'}
                                  {hasReplies && ` (${(annotation.replies?.length || 0)} replies)`}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}

                      {/* Render real-time annotations on image */}
                      {currentFileRealtimeAnnotations.map((annotation) => {
                        if (
                          annotation.x !== undefined &&
                          annotation.y !== undefined
                        ) {
                          const hasReplies = annotation.replies && annotation.replies.length > 0
                          const isOriginalMessage = !annotation.replies || annotation.replies.length === 0

                          return (
                            <div
                              key={`realtime-${annotation.id}`}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                              style={{
                                left: `${annotation.x}%`,
                                top: `${annotation.y}%`,
                              }}
                            >
                              {/* Main annotation pin with blinking effect for original messages */}
                              <div
                                className={`${annotation.resolved
                                  ? "bg-green-500"
                                  : "bg-red-500"
                                  } text-white text-xs px-3 py-2 rounded-full shadow-lg cursor-pointer hover:opacity-90 transition-all duration-300 group ${isOriginalMessage ? 'animate-pulse ring-2 ring-white ring-opacity-50' : ''
                                  }`}
                                onClick={() => {
                                  console.log('🔍 Real-time annotation clicked:', annotation);
                                  const chatData = {
                                    id: annotation.id,
                                    content: annotation.content || (typeof annotation.comment === 'string' ? annotation.comment : 'Annotation'),
                                    fileId: annotation.fileId || '',
                                    addedBy: annotation.addedBy || 'Unknown',
                                    addedByName: annotation.addedByName || 'Unknown',
                                    createdAt: annotation.createdAt || (typeof annotation.timestamp === 'string' ? annotation.timestamp : new Date().toISOString()),
                                    x: annotation.x,
                                    y: annotation.y,
                                    status: annotation.status || (annotation.resolved ? "COMPLETED" : 'PENDING'),
                                    isResolved: annotation.isResolved || annotation.resolved,
                                    replies: annotation.replies || []
                                  };
                                  console.log('🔍 Chat data:', chatData);
                                  handleAnnotationChatClick(chatData as ProjectAnnotation);
                                }}
                              >
                                {/* Original message indicator */}
                                {isOriginalMessage && (
                                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white animate-bounce">
                                    <div className="w-full h-full bg-orange-400 rounded-full animate-ping"></div>
                                  </div>
                                )}

                                <MapPin className="h-3 w-3 inline mr-1" />

                                {/* Message content */}
                                <span className="font-medium">
                                  {typeof annotation.comment === 'string' && annotation.comment.length > 12 ? annotation.comment.substring(0, 12) + '...' : (typeof annotation.comment === 'string' ? annotation.comment : 'Annotation')}
                                </span>

                                {/* Reply count badge */}
                                {hasReplies && (
                                  <span className="ml-1 bg-white text-blue-600 rounded-full px-1.5 py-0.5 text-xs font-bold">
                                    {annotation.replies?.length || 0}
                                  </span>
                                )}

                                {/* Status indicator */}
                                <div
                                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${annotation.resolved
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                    } border-2 border-white`}
                                ></div>
                              </div>

                              {/* Quick action tooltip */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                <div className="bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                  {isOriginalMessage ? 'Original Message' : 'View Conversation'}
                                  {hasReplies && ` (${(annotation.replies?.length || 0)} replies)`}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}

                      {/* Click to annotate badge */}
                      {reviewData.status !== "COMPLETED" && reviewData.status !== "REJECTED" && (
                        <div className="absolute top-4 left-4">
                          <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                            <MapPin className="h-3 w-3 mr-1" />
                            Click to annotate
                          </Badge>
                        </div>
                      )}

                      {/* Status message badge */}
                      {(reviewData.status === "COMPLETED" || reviewData.status === "REJECTED") && (
                        <div className="absolute top-4 left-4">
                          <Badge variant="outline" className={`text-xs ${reviewData.status === "COMPLETED" ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                            {reviewData.status === "COMPLETED" ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Version Completed
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Version Rejected
                              </>
                            )}
                          </Badge>
                        </div>
                      )}

                      {/* Annotation counter badge */}
                      {(currentFileAnnotations.length > 0 ||
                        currentFileRealtimeAnnotations.length > 0) && (
                          <div className="absolute top-4 right-4">
                            <Badge
                              variant="default"
                              className="text-xs bg-blue-500 text-white"
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {currentFileAnnotations.length +
                                currentFileRealtimeAnnotations.length}{" "}
                              annotation
                              {currentFileAnnotations.length + currentFileRealtimeAnnotations.length !==
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
                currentFileRealtimeAnnotations.length > 0 ||
                currentFileAnnotations.length > 0) && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Comments & Annotations (
                        {realtimeComments.length +
                          currentFileRealtimeAnnotations.length +
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
                        {currentFileRealtimeAnnotations.map((annotation) => (
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
                                    {typeof annotation.timestamp === 'string' ? new Date(annotation.timestamp).toLocaleString() : 'Date not available'}
                                  </span>
                                </div>
                                <p className="text-sm">{typeof annotation.comment === 'string' ? annotation.comment : 'Annotation content'}</p>

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
                                <p className="text-sm">{typeof annotation.content === 'string' ? annotation.content : 'Annotation content'}</p>


                                {/* Show replies if any */}
                                {annotation.replies &&
                                  annotation.replies.length > 0 && (
                                    <div className="mt-3 ml-4 space-y-2">
                                      <div className="text-xs font-medium text-muted-foreground mb-2">
                                        Replies ({typeof annotation.replies === 'object' && annotation.replies ? annotation.replies.length : 0})
                                      </div>
                                      {annotation.replies.map((reply) => (
                                        <div
                                          key={typeof reply.id === 'string' ? reply.id : `reply-${Math.random()}`}
                                          className="p-2 bg-gray-50 dark:bg-gray-800 rounded border-l-2 border-blue-500"
                                        >
                                          <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                            <span className="text-xs font-medium">
                                              {typeof reply.addedByName === 'string' ? reply.addedByName : (typeof reply.addedBy === 'string' ? reply.addedBy : 'Unknown')}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              {typeof reply.createdAt === 'string' ? new Date(reply.createdAt).toLocaleString() : 'Date not available'}
                                            </span>
                                          </div>
                                          <p className="text-xs">
                                            {(() => {
                                              try {
                                                if (typeof reply.content === 'string') {
                                                  return reply.content;
                                                } else if (reply.content && typeof reply.content === 'object') {
                                                  return (reply.content as any)?.content || 'Reply content';
                                                }
                                                return 'Reply content';
                                              } catch (error) {
                                                return 'Reply content';
                                              }
                                            })()}
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
                          className={`p-4 border rounded-lg ${revision.status === "COMPLETED"
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
                                    revision.status === "COMPLETED"
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
                                    revision.status === "COMPLETED"
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
                        reviewData.status === "COMPLETED"
                          ? "default"
                          : reviewData.status === "rejected"
                            ? "destructive"
                            : reviewData.status === "in_revision"
                              ? "secondary"
                              : "outline"
                      }
                    >
                      {getStatusText(reviewData.status || "unknown")}
                    </Badge>
                  </div> */}
                  <div>
                    <Label className="text-sm font-medium">Review Status</Label>
                    <Badge
                      variant={
                        reviewData.status === "COMPLETED"
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
              {reviewData.status === "COMPLETED"  ? (
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
              ) : reviewData.status === "REJECTED" ? (
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
                      Approve  
                    </Button>

                    <Button
                      onClick={handleRejection}
                      variant="destructive"
                      className="w-full"
                    >
                      <Icons.X />
                      Reject  
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
                      {getCurrentFileChatMessages().length} messages
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Real-time communication with admin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {getCurrentFileChatMessages().length > 0 ? (
                      getCurrentFileChatMessages().map((message) => (
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
            <DialogTitle>Reject</DialogTitle>
            <DialogDescription>
              Please provide detailed feedback about why you are rejecting this design and what changes are needed. You will need to provide your digital signature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
             
            <div>
              <Label htmlFor="revisionComments">Rejection Comments</Label>
              <Textarea
                id="revisionComments"
                placeholder="Describe the changes you are rejecting..."
                value={revisionComments}
                onChange={(e) => setRevisionComments(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rejectFirstName">First Name</Label>
                <Input
                  id="rejectFirstName"
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
                <Label htmlFor="rejectLastName">Last Name</Label>
                <Input
                  id="rejectLastName"
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRevisionDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRequestRevision} 
              variant="destructive"
              disabled={isRejecting}
              className="disabled:opacity-50"
            >
              {isRejecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Rejecting...
                </>
              ) : (
                'Submit Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Digital Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Digital Signature Required</DialogTitle>
            
          </DialogHeader>
          <div className="space-y-4">
             
            <div>
              <Label htmlFor="firstName" className="mb-2">First Name</Label>
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
              <Label htmlFor="lastName" className="mb-2">Last Name</Label>
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
            <Button 
              onClick={handleApproval}
              disabled={isApproving}
              className="disabled:opacity-50"
            >
              {isApproving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Approving...
                </>
              ) : (
                'Continue to Approval'
              )}
            </Button>
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

      {/* Annotation Chat Conversation Popup */}
      {showAnnotationChat && selectedAnnotationChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Annotation Conversation
                </h3>
                {/* <Badge variant="outline" className="text-xs">
                  Position: {selectedAnnotationChat.x?.toFixed(0) || 0}%, {selectedAnnotationChat.y?.toFixed(0) || 0}%
                </Badge> */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    console.log('🔄 Manually refreshing annotations...');
                    await fetchAnnotations(true); // Force refresh
                  }}
                  disabled={isFetchingAnnotations}
                  className="text-xs"
                >
                  {isFetchingAnnotations ? '⏳ Loading...' : '🔄 Refresh'}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseAnnotationChat}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Conversation Messages */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">

              {/* Original Message */}
              <div className="flex justify-start">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 max-w-[80%] border-l-4 border-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {selectedAnnotationChat.addedByName || selectedAnnotationChat.addedBy || "Unknown"}
                    </span>
                   
                    <span className="text-xs text-gray-500">
                      {selectedAnnotationChat.createdAt
                        ? new Date(selectedAnnotationChat.createdAt).toLocaleString()
                        : 'Date not available'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                    {selectedAnnotationChat.content}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      📌 Original Message
                    </div>
                    {selectedAnnotationChat.replies && selectedAnnotationChat.replies.length > 0 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        💬 {selectedAnnotationChat.replies.length} replies
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {(() => {
                console.log('🔍 Rendering replies in chat popup:');
                console.log('🔍 selectedAnnotationChat:', selectedAnnotationChat);
                console.log('🔍 selectedAnnotationChat.replies:', selectedAnnotationChat.replies);
                console.log('🔍 selectedAnnotationChat.replies?.length:', selectedAnnotationChat.replies?.length);
                return null;
              })()}
              {selectedAnnotationChat.replies && selectedAnnotationChat.replies.length > 0 ? (
                <>
                  <div className="text-center py-2">
                    <div className="text-xs text-gray-500 font-medium">
                      💬 {selectedAnnotationChat.replies?.length || 0} {(selectedAnnotationChat.replies?.length || 0) === 1 ? 'Reply' : 'Replies'}
                    </div>
                  </div>
                  {selectedAnnotationChat.replies?.map((reply, index) => {
                    const isFromClient = reply.addedBy === 'Client' || reply.addedByName === 'Client';
                    return (
                      <div key={reply.id || `reply-${index}`} className={`flex ${isFromClient ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg p-3 max-w-[80%] ${isFromClient
                            ? 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500'
                            : 'bg-gray-100 dark:bg-gray-800 border-l-4 border-gray-400'
                          }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${isFromClient ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                            <span className={`text-sm font-semibold ${isFromClient ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                              {reply.addedByName || reply.addedBy || "Unknown"}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {isFromClient ? 'Client' : 'Admin'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {reply.createdAt
                                ? new Date(reply.createdAt).toLocaleString()
                                : 'Date not available'}
                            </span>
                          </div>
                          <p className={`text-sm ${isFromClient ? 'text-gray-800 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300'}`}>
                            {(() => {
                              try {
                                if (typeof reply.content === 'string') {
                                  return reply.content;
                                } else if (reply.content && typeof reply.content === 'object') {
                                  return (reply.content as any)?.content || 'Reply content';
                                }
                                return 'Reply content';
                              } catch (error) {
                                return 'Reply content';
                              }
                            })()}
                          </p>
                          <div className={`mt-2 text-xs ${isFromClient ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'} font-medium`}>
                            💬 Reply #{index + 1} • {isFromClient ? 'From Client' : 'From Admin'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No replies yet. Be the first to respond!</p>
                  <div className="text-xs text-gray-400 mt-2">
                    Debug: {selectedAnnotationChat.replies?.length || 0} replies found
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            {!selectedAnnotationChat.isResolved && reviewData.status !== "COMPLETED" && reviewData.status !== "REJECTED" && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && replyText.trim()) {
                        handleReplySubmit();
                        setReplyText('');
                      }
                    }}
                    className="flex-1 border-0 focus:ring-0 text-sm dark:bg-gray-800 dark:text-gray-100"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
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

                    {/* Submit Button */}
                    <Button
                      size="sm"
                      onClick={() => {
                        handleReplySubmit();
                        setReplyText('');
                      }}
                      disabled={!replyText.trim() || isSubmittingReply}
                      className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-full"
                    >
                      {isSubmittingReply ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
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
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Status message when version is completed or rejected */}
            {!selectedAnnotationChat.isResolved && (reviewData.status === "COMPLETED" || reviewData.status === "REJECTED") && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className={`mb-2 ${reviewData.status === "COMPLETED" ? 'text-green-500' : 'text-red-500'}`}>
                  {reviewData.status === "COMPLETED" ? (
                    <CheckCircle className="h-8 w-8 mx-auto" />
                  ) : (
                    <AlertCircle className="h-8 w-8 mx-auto" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {reviewData.status === "COMPLETED"
                    ? 'This version has been completed. No further replies can be added.'
                    : 'This version has been rejected. No further replies can be added.'
                  }
                </p>
              </div>
            )}

            {/* Resolved message */}
            {selectedAnnotationChat.isResolved && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className="text-green-500 mb-2">
                  <CheckCircle className="h-8 w-8 mx-auto" />
                </div>
                <p className="text-sm text-muted-foreground">
                  This annotation has been resolved and cannot be replied to.
                </p>
              </div>
            )}

            {/* Reply Popup (Legacy - keeping for backward compatibility) */}
            {showReplyPopup && selectedAnnotationForReply && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Quick Reply
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
                          {selectedAnnotationForReply.addedByName || selectedAnnotationForReply.addedBy || "Unknown"}
                        </span>

                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {selectedAnnotationForReply.content}
                      </p>

                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="p-4">
                    {selectedAnnotationForReply.status === "COMPLETED" || selectedAnnotationForReply.status === "REJECTED" ? (
                      <div className="text-center py-4">
                        <div className={`mb-2 ${selectedAnnotationForReply.status === "COMPLETED" ? 'text-green-500' : 'text-red-500'}`}>
                          <CheckCircle className="h-8 w-8 mx-auto" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          This annotation has been {selectedAnnotationForReply.status.toLowerCase()} and cannot be replied to.
                        </p>
                      </div>
                    ) : (reviewData.status === "COMPLETED" || reviewData.status === "REJECTED") ? (
                      <div className="text-center py-4">
                        <div className={`mb-2 ${reviewData.status === "COMPLETED" ? 'text-green-500' : 'text-red-500'}`}>
                          {reviewData.status === "COMPLETED" ? (
                            <CheckCircle className="h-8 w-8 mx-auto" />
                          ) : (
                            <AlertCircle className="h-8 w-8 mx-auto" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {reviewData.status === "COMPLETED"
                            ? 'This version has been completed. No further replies can be added.'
                            : 'This version has been rejected. No further replies can be added.'
                          }
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
                  {selectedAnnotationForReply.status === 'PENDING' && reviewData.status !== "COMPLETED" && reviewData.status !== "REJECTED" && (
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
                        disabled={!replyText.trim() || isSubmittingReply}
                        className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-full"
                      >
                        {isSubmittingReply ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
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
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
        images={lightboxImages}
        currentIndex={lightboxIndex}
        onIndexChange={setLightboxIndex}
        imageAlt="Review Image"
        showNavigation={lightboxImages.length > 1}
        showThumbnails={lightboxImages.length > 1}
      />
    </div>
  );
}