"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ReactSketchCanvas } from "react-sketch-canvas";
import {
  MapPin,
  Circle,
  Square,
  ArrowRight,
  Type,
  Pencil,
  X,
  Trash2,
  Undo,
  Edit2,
  PenTool,
  Droplets,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
// Removed localStorage imports - now using database APIs
import { WelcomeModal } from "./welcome-modal";
import { useSocket } from "@/contexts/SocketContext";
import toast from 'react-hot-toast';
interface DesignItem {
  id: number;
  file_url?: string;
  file_name?: string;
  url?: string;
  name?: string;
  type?: string;
  size?: number;
  version?: number;
}

interface DesignViewerProps {
  designItems: DesignItem[];
  reviewId: number;
  projectName: string;
  hideApprovalButtons?: boolean; // Add this new prop
  initialStatus?: string; // Add initial status prop
}

interface Comment {
  id: number;
  author: string;
  content: string;
  timestamp: Date;
  type: "comment" | "annotation";
  hasDrawing: boolean;
  drawingData?: string; // Base64 image of the drawing
  canvasPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
    imageWidth: number;
    imageHeight: number;
  };
  designItemId: number;
  createdAt: string;
}

interface Annotation {
  id: number;
  designItemId: number;
  xPosition: number;
  yPosition: number;
  content: string;
  createdAt: string;
}

export function DesignViewer({
  designItems,
  reviewId,
  projectName,
  hideApprovalButtons = false,
  initialStatus = 'PENDING',
}: DesignViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [annotations, setAnnotations] = useState<Record<number, Annotation[]>>({});
  const [newCommentText, setNewCommentText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [selectedComment, setSelectedComment] = useState<number | null>(null);
  const [annotationDrawings, setAnnotationDrawings] = useState<
    Record<number, string>
  >({});
  const [loaded, setLoaded] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>(initialStatus);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const { socket, isConnected } = useSocket();
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // Annotation state
  const [annotationMode, setAnnotationMode] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const canvasRef = useRef<any>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const selectedItem = designItems[selectedIndex];
  const itemComments = comments[selectedItem.id] || [];

  const colors = [
    "#ef4444",
    "#3b82f6",
    "#22c55e",
    "#eab308",
    "#a855f7",
    "#ec4899",
    "#000000",
  ];

  // Load comments and annotations from database on mount
  useEffect(() => {
    const loadCommentsAndAnnotations = async () => {
      setIsLoadingComments(true);
      try {
        const commentsMap: Record<number, Comment[]> = {};
        const annotationsMap: Record<number, Annotation[]> = {};

        // Load comments and annotations for all design items
        for (const item of designItems) {
          // Load comments
          const commentsResponse = await fetch(`/api/comments?designItemId=${item.id}`);
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            commentsMap[item.id] = commentsData.map((c: any) => ({
              id: c.id,
              author: c.author,
              content: c.content,
              timestamp: new Date(c.createdAt),
              type: c.type,
              hasDrawing: !!c.drawingData,
              drawingData: c.drawingData,
              canvasPosition: c.canvasX !== null ? {
                x: c.canvasX,
                y: c.canvasY,
                width: c.canvasWidth,
                height: c.canvasHeight,
                imageWidth: c.imageWidth,
                imageHeight: c.imageHeight
              } : undefined,
              designItemId: c.designItemId,
              createdAt: c.createdAt
            }));
          }

          // Load annotations
          const annotationsResponse = await fetch(`/api/annotations?designItemId=${item.id}`);
          if (annotationsResponse.ok) {
            const annotationsData = await annotationsResponse.json();
            annotationsMap[item.id] = annotationsData.map((a: any) => ({
              id: a.id,
              designItemId: a.designItemId,
              xPosition: parseFloat(a.xPosition),
              yPosition: parseFloat(a.yPosition),
              content: a.content,
              createdAt: a.createdAt
            }));
          }
        }

        setComments(commentsMap);
        setAnnotations(annotationsMap);
        setLoaded(true);
      } catch (error) {
        console.error('Error loading comments and annotations:', error);
      } finally {
        setIsLoadingComments(false);
      }
    };

    if (designItems.length > 0) {
      loadCommentsAndAnnotations();
    }
  }, [designItems]);

  // Socket.IO real-time communication
  useEffect(() => {
    if (socket && isConnected) {
      // Join review room
      socket.emit('join-review', reviewId);

      // Listen for new comments
      socket.on('comment-added', (data) => {
        console.log('New comment received via socket:', data);

        // Add the new comment to the state
        const newComment: Comment = {
          id: data.commentId,
          author: data.author,
          content: data.content,
          timestamp: new Date(),
          type: data.type,
          hasDrawing: data.hasDrawing || false,
          drawingData: data.drawingData || undefined,
          canvasPosition: data.canvasPosition,
          designItemId: data.designItemId,
          createdAt: new Date().toISOString()
        };

        // Update comments state
        setComments(prevComments => ({
          ...prevComments,
          [data.designItemId]: [...(prevComments[data.designItemId] || []), newComment]
        }));

        // Update annotation drawings if it has drawing data
        if (data.hasDrawing && data.drawingData) {
          setAnnotationDrawings(prev => ({
            ...prev,
            [data.commentId]: data.drawingData
          }));
        }

        // Show notification for new comment
        toast.success(`New ${data.type} from ${data.author}`, {
          duration: 3000,
          icon: data.hasDrawing ? '🎨' : '💬'
        });

        // Auto-scroll to bottom for new comments
        setTimeout(() => {
          if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTo({
              top: commentsContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 100);
      });

      // Listen for status updates
      socket.on('status-updated', (data) => {
        console.log('Status updated via socket:', data);
        setReviewStatus(data.status);

        if (data.status === 'APPROVED') {
          toast.success('🎉 Project has been approved!', {
            duration: 5000,
            icon: '✅'
          });
        } else if (data.status === 'REVISION_REQUESTED') {
          toast('📝 Revision requested. Please review the feedback.', {
            duration: 5000,
            icon: '📝'
          });
        }
      });

      // Cleanup listeners on unmount
      return () => {
        socket.off('comment-added');
        socket.off('status-updated');
      };
    }
  }, [socket, isConnected, reviewId]);

  // Sync initial status when prop changes
  useEffect(() => {
    setReviewStatus(initialStatus);
  }, [initialStatus]);

  // Check for author name and show welcome modal if needed
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("client_proofing_author_name");
      if (savedName) {
        setAuthorName(savedName);
        setShowWelcomeModal(false);
      } else {
        // No name found, show welcome modal
        setShowWelcomeModal(true);
      }
    }
  }, []);

  // Track image size changes for responsive annotations
  useEffect(() => {
    const updateImageSize = () => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        setImageSize({ width: rect.width, height: rect.height });
      }
    };

    // Initial size
    updateImageSize();

    // Listen for window resize
    window.addEventListener('resize', updateImageSize);

    // Use ResizeObserver for more accurate tracking
    let resizeObserver: ResizeObserver | null = null;
    if (imageRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateImageSize);
      resizeObserver.observe(imageRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateImageSize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [selectedItem.id]);

  const handleWelcomeSubmit = (name: string) => {
    setAuthorName(name);
    localStorage.setItem("client_proofing_author_name", name);
    setShowWelcomeModal(false);
  };

  const handleChangeName = () => {
    const newName = prompt("Enter your new name:", authorName);
    if (newName && newName.trim()) {
      setAuthorName(newName.trim());
      localStorage.setItem("client_proofing_author_name", newName.trim());
    }
  };

  const handleSubmitAnnotation = async () => {
    if (reviewStatus === 'APPROVED') {
      toast.error('Comments are disabled for approved projects');
      return;
    }

    if (!newCommentText.trim() || !authorName.trim()) {
      toast.error("Please enter your name and message", {
        duration: 3000,
      });
      return;
    }

    setIsSubmittingComment(true);

    let hasDrawing = false;
    let drawingData = undefined;
    let canvasPosition = null;

    // Check if there are any drawings and export image
    if (canvasRef.current && isAddingAnnotation) {
      try {
        const paths = await canvasRef.current.exportPaths();
        hasDrawing = paths && paths.length > 0;

        if (hasDrawing) {
          // Export drawing as base64 image
          drawingData = await canvasRef.current.exportImage("png");

          // Capture canvas position and dimensions relative to the image using percentages
          const canvasElement = canvasRef.current.getSketchingCanvas();
          if (canvasElement) {
            const imageContainer = canvasElement.closest('.relative');
            const imageElement = imageContainer?.querySelector('img');

            if (imageElement) {
              const imageRect = imageElement.getBoundingClientRect();
              const canvasRect = canvasElement.getBoundingClientRect();

              // Calculate relative positions as percentages of the image dimensions
              const relativeX = (canvasRect.left - imageRect.left) / imageRect.width;
              const relativeY = (canvasRect.top - imageRect.top) / imageRect.height;
              const relativeWidth = canvasRect.width / imageRect.width;
              const relativeHeight = canvasRect.height / imageRect.height;

              canvasPosition = {
                x: relativeX, // Store as percentage (0-1)
                y: relativeY, // Store as percentage (0-1)
                width: relativeWidth, // Store as percentage (0-1)
                height: relativeHeight, // Store as percentage (0-1)
                imageWidth: imageRect.width,
                imageHeight: imageRect.height
              };
            }
          }
        }
      } catch (e) {
        console.log("No drawings to export");
      }
    }

    try {
      // Save to database via API
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designItemId: selectedItem.id,
          author: authorName,
          content: newCommentText,
          type: isAddingAnnotation ? "annotation" : "comment",
          drawingData: drawingData || null,
          canvasPosition: canvasPosition
        }),
      });

      if (response.ok) {
        const savedComment = await response.json();

        // Convert to component format
        const newComment: Comment = {
          id: savedComment.id,
          author: savedComment.author,
          content: savedComment.content,
          timestamp: new Date(savedComment.createdAt),
          type: savedComment.type,
          hasDrawing: !!savedComment.drawingData,
          drawingData: savedComment.drawingData,
          designItemId: savedComment.designItemId,
          createdAt: savedComment.createdAt
        };

        // Update state
        setComments({
          ...comments,
          [selectedItem.id]: [...itemComments, newComment],
        });

        // Auto-scroll to bottom after adding comment
        setTimeout(() => {
          if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTo({
              top: commentsContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 100);

        // Store drawing separately for overlay display
        if (drawingData) {
          setAnnotationDrawings({
            ...annotationDrawings,
            [savedComment.id]: drawingData,
          });
        }

        setNewCommentText("");
        setIsAddingAnnotation(false);
        setAnnotationMode(false);

        // Emit socket event for real-time updates
        if (socket && isConnected) {
          socket.emit('new-comment', {
            reviewId: reviewId,
            commentId: savedComment.id,
            author: savedComment.author,
            content: savedComment.content,
            type: savedComment.type,
            designItemId: savedComment.designItemId,
            hasDrawing: hasDrawing,
            drawingData: drawingData || null,
            canvasPosition: canvasPosition
          });
        }

        if (hasDrawing) {
          toast.success("✅ Annotation with drawing saved successfully!", {
            duration: 4000,
          });
          // Clear canvas after submit
          if (canvasRef.current) {
            canvasRef.current.clearCanvas();
          }
        } else {
          toast.success("✅ Comment saved successfully!", {
            duration: 4000,
          });
        }
      } else {
        throw new Error('Failed to save comment');
      }
    } catch (error) {
      console.error('Error saving comment:', error);
      toast.error("❌ Failed to save comment. Please try again.", {
        duration: 4000,
      });
    } finally {
      setIsSubmittingComment(false);
    }

    // Save author name for future use
    if (typeof window !== "undefined") {
      localStorage.setItem("client_proofing_author_name", authorName);
    }
  };

  const handleCommentClick = (comment: Comment) => {
    if (comment.hasDrawing) {
      // Toggle viewing annotation on image
      if (selectedComment === comment.id) {
        setSelectedComment(null); // Hide annotation
      } else {
        setSelectedComment(comment.id); // Show annotation
      }
    } else {
      // For regular comments, just select/deselect
      setSelectedComment(selectedComment === comment.id ? null : comment.id);
    }
  };

  const handleClearDrawings = () => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
  };

  const handleUndo = () => {
    if (canvasRef.current) {
      canvasRef.current.undo();
    }
  };

  const getTimeAgo = (date: Date) => {
    const days = Math.floor(
      (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  const copyFileUrl = async () => {
    const fileUrl = selectedItem.url || selectedItem.file_url;
    if (!fileUrl) return;

    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${fileUrl}` : fileUrl;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const updateReviewStatus = async (status: 'APPROVED' | 'REVISION_REQUESTED') => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/reviews/status?reviewId=${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setReviewStatus(status);

        // Emit socket event for real-time updates
        if (socket && isConnected) {
          socket.emit('update-status', {
            reviewId: reviewId,
            status: status,
            updatedBy: authorName || 'Admin'
          });
        }

        if (status === 'APPROVED') {
          toast.success('🎉 Project approved successfully!', {
            duration: 5000,
            icon: '✅'
          });
        } else {
          toast.success('📝 Revision requested successfully!', {
            duration: 5000,
            icon: '✅'
          });
        }
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating review status:', error);
      toast.error('❌ Failed to update status. Please try again.', {
        duration: 5000,
        icon: '❌'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Thumbnails Row with Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between p-4 lg:p-6 bg-[#1a1a1a] gap-4 lg:gap-0">
        {/* Thumbnails */}
        <div className="flex gap-3 lg:gap-6 overflow-x-auto">
          {designItems.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <button
                onClick={() => setSelectedIndex(index)}
                className={`w-24 h-16 lg:w-32 lg:h-20 rounded overflow-hidden border-2 transition-all ${selectedIndex === index
                    ? "border-[#fdb913] ring-2 ring-[#fdb913]/50"
                    : "border-neutral-700 hover:border-neutral-600"
                  }`}
              >
                <Image
                  src={item.url || item.file_url || "/placeholder.svg"}
                  alt={item.name || item.file_name || "Design file"}
                  width={128}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </button>

            </div>
          ))}
        </div>


        {/* Action Buttons - Conditionally render based on hideApprovalButtons prop */}
        {!hideApprovalButtons && (
          <div className="flex flex-col gap-4 lg:min-w-[280px] w-full lg:w-auto">
            {/* Action Buttons */}
            <div className="flex flex-row lg:flex-col gap-3">
              <button
                onClick={() => updateReviewStatus('APPROVED')}
                disabled={isUpdatingStatus || reviewStatus === 'APPROVED'}
                className="flex-1 lg:w-full px-4 lg:px-6 py-2.5 lg:py-3.5 bg-transparent border-2 border-green-500 text-green-500 font-bold rounded hover:bg-green-500 hover:text-black transition-all uppercase tracking-wide text-xs lg:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingStatus ? 'Updating...' : reviewStatus === 'APPROVED' ? 'Project Approved' : 'Approve Project'}
              </button>
              <button
                onClick={() => updateReviewStatus('REVISION_REQUESTED')}
                disabled={isUpdatingStatus || reviewStatus === 'REVISION_REQUESTED' || reviewStatus === 'APPROVED'}
                className="flex-1 lg:w-full px-4 lg:px-6 py-2.5 lg:py-3.5 bg-transparent border-2 border-yellow-500 text-yellow-500 font-bold rounded hover:bg-yellow-500 hover:text-black transition-all uppercase tracking-wide text-xs lg:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingStatus ? 'Updating...' : reviewStatus === 'APPROVED' ? 'Cannot Request Revisions' : 'Request Revisions'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Image Display Area with Drawing Canvas */}
        <div className="flex-1 bg-black flex items-center justify-center p-1 lg:p-2 overflow-hidden relative min-h-0 max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-120px)]">
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              ref={imageRef}
              src={selectedItem.url || selectedItem.file_url || "/placeholder.svg"}
              alt={selectedItem.name || selectedItem.file_name || "Design file"}
              width={1200}
              height={900}
              className="h-full w-auto object-contain"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
              priority
              onLoad={() => {
                // Trigger size update when image loads
                setTimeout(() => {
                  if (imageRef.current) {
                    const rect = imageRef.current.getBoundingClientRect();
                    setImageSize({ width: rect.width, height: rect.height });
                  }
                }, 100);
              }}
            />

            {/* Annotation Mode - Drawing Canvas */}
            {annotationMode && (
              <div className="absolute inset-0">
                <ReactSketchCanvas
                  ref={canvasRef}
                  strokeColor={strokeColor}
                  strokeWidth={strokeWidth}
                  canvasColor="transparent"
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
            )}

            {/* View Mode - Show Selected Annotation Drawing on Image */}
            {!annotationMode && selectedComment && itemComments.find(c => c.id === selectedComment)?.hasDrawing && (() => {
              const selectedCommentData = itemComments.find(c => c.id === selectedComment);
              if (!selectedCommentData?.canvasPosition) {
                // Fallback to full overlay if no position data
                return (
                  <div className="absolute inset-0 pointer-events-none">
                    <Image
                      src={selectedCommentData?.drawingData || ""}
                      alt="Selected Annotation Drawing"
                      width={1200}
                      height={900}
                      className="h-full w-full object-contain opacity-90"
                    />
                  </div>
                );
              }

              // Use percentage-based positioning for responsive design
              const position = selectedCommentData.canvasPosition;

              return (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${position.x * 100}%`,
                    top: `${position.y * 100}%`,
                    width: `${position.width * 100}%`,
                    height: `${position.height * 100}%`,
                  }}
                >
                  <Image
                    src={selectedCommentData.drawingData || ""}
                    alt="Selected Annotation Drawing"
                    width={1200}
                    height={900}
                    className="w-full h-full object-contain opacity-90"
                  />
                </div>
              );
            })()}

            {/* Selected Annotation Badge */}
            {!annotationMode && selectedComment && itemComments.find(c => c.id === selectedComment)?.hasDrawing && (
              <div className="absolute top-2 left-2 lg:top-4 lg:left-4 px-2 lg:px-4 py-1 lg:py-2 bg-[#fdb913] text-black rounded-lg font-bold text-xs lg:text-sm shadow-xl flex items-center gap-1 lg:gap-2 animate-pulse">
                <Pencil className="w-3 h-3 lg:w-4 lg:h-4" />
                <span>
                  Showing annotation by {itemComments.find(c => c.id === selectedComment)?.author}
                </span>
                <button
                  onClick={() => setSelectedComment(null)}
                  className="ml-2 px-2 py-1 bg-black/20 hover:bg-black/40 rounded text-xs transition-colors"
                  title="Hide annotation"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Comments & Annotations */}
        <div className="w-full lg:w-96 bg-black border-t lg:border-t-0 lg:border-l border-neutral-800 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {/* Section Header */}
          <div className="p-3 lg:p-4 border-b border-neutral-800 flex-shrink-0">
            <h3 className="text-base lg:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#fdb913]">💬</span>
              Comments & Annotations
            </h3>
          </div>

          {/* Comments & Annotations List */}
          <div
            ref={commentsContainerRef}
            className="flex-1 overflow-y-auto p-3 lg:p-6 comments-scrollbar relative"
            style={{
              maxHeight: 'calc(100vh - 400px)',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch'
            }}
            onScroll={(e) => {
              const container = e.target as HTMLDivElement;
              const { scrollTop, scrollHeight, clientHeight } = container;
              const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
              setShowScrollToBottom(!isAtBottom);
            }}
          >
            {itemComments.length > 0 ? (
              <div className="space-y-3 lg:space-y-4">
                {itemComments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`cursor-pointer transition-all ${comment.type === "annotation"
                        ? `p-2 lg:p-3 rounded-lg ${selectedComment === comment.id
                          ? "bg-[#fdb913]/30 border-2 border-[#fdb913]"
                          : "bg-[#fdb913]/10 border border-[#fdb913]/30"
                        } hover:bg-[#fdb913]/20`
                        : `p-2 rounded ${selectedComment === comment.id
                          ? "bg-neutral-800 border border-neutral-600"
                          : "hover:bg-neutral-900/50"
                        }`
                      }`}
                    onClick={() => handleCommentClick(comment)}
                  >
                    <div className="flex gap-2 lg:gap-3">
                      <div
                        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs lg:text-sm flex-shrink-0 ${comment.type === "annotation"
                            ? "bg-gradient-to-br from-[#fdb913] to-orange-500"
                            : "bg-gradient-to-br from-purple-500 to-pink-500"
                          }`}
                      >
                        {comment.type === "annotation"
                          ? "📍"
                          : comment.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-1 lg:gap-2 mb-1 flex-wrap">
                          <span className="text-white font-semibold text-xs lg:text-sm">
                            {comment.author}
                          </span>
                          {comment.type === "annotation" && (
                            <span className="px-1.5 lg:px-2 py-0.5 bg-[#fdb913]/20 text-[#fdb913] text-xs rounded font-semibold">
                              Annotation
                            </span>
                          )}
                          <span className="text-neutral-500 text-xs">
                            •{getTimeAgo(comment.timestamp)}
                          </span>
                        </div>
                        <p className="text-neutral-300 text-xs lg:text-sm leading-relaxed">
                          {comment.content}
                        </p>
                        {comment.hasDrawing && (
                          <div className="mt-1 lg:mt-2 text-xs text-[#fdb913] flex items-center gap-1">
                            <Pencil className="w-3 h-3" />
                            {selectedComment === comment.id
                              ? "✓ Showing on image"
                              : "👁️ Click to view on image"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="text-center">
                  <div className="text-neutral-600 text-4xl mb-2">💬</div>
                  <p className="text-neutral-500 text-xs lg:text-sm mb-2">
                    No comments yet
                  </p>
                  <p className="text-neutral-600 text-xs">
                    Add your first comment below
                  </p>
                </div>

                {/* Placeholder comments to show scrollbar */}
                <div className="w-full space-y-3 opacity-30">
                  <div className="p-2 rounded bg-neutral-900/50">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                        A
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-white font-semibold text-xs">Admin</span>
                          <span className="text-neutral-500 text-xs">•today</span>
                        </div>
                        <p className="text-neutral-300 text-xs">Sample comment...</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-neutral-900/50">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                        C
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-white font-semibold text-xs">Client</span>
                          <span className="text-neutral-500 text-xs">•today</span>
                        </div>
                        <p className="text-neutral-300 text-xs">Another sample comment...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
 
          </div>

          {/* Add Comment/Annotation Input - WeTransfer Style with Custom Icons */}
          <div className="p-3 lg:p-4 border-t border-neutral-800 space-y-2 lg:space-y-3 flex-shrink-0 bg-black">
            {/* Approved Status Message */}
            {reviewStatus === 'APPROVED' && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
                <div className="text-green-400 text-4xl mb-2">🎉</div>
                <h3 className="text-green-400 font-bold text-lg mb-2">Project Approved!</h3>
                <p className="text-green-300 text-sm mb-4">
                  This project has been approved. Comments are now disabled.
                </p>

                {/* Download Button */}
                <button
                  onClick={() => {
                    // Download all files for this project
                    designItems.forEach((item, index) => {
                      const link = document.createElement('a');
                      link.href = item.url || item.file_url || '';
                      link.download = item.name || item.file_name || `design-${index + 1}`;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    });
                    toast.success('Download started!');
                  }}
                  className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download All Files
                </button>
              </div>
            )}

            {/* Regular Comment Input - Only show if not approved */}
            {reviewStatus !== 'APPROVED' && (
              <>
                {/* Mode Indicator */}
                {isAddingAnnotation && (
                  <div className="px-2 lg:px-3 py-1.5 lg:py-2 bg-[#fdb913]/20 border border-[#fdb913]/50 rounded text-[#fdb913] text-xs font-semibold flex items-center gap-2">
                    <Pencil className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="hidden sm:inline">
                      Annotation Mode - Draw on image & add message
                    </span>
                    <span className="sm:hidden">Annotation Mode</span>
                  </div>
                )}

                {/* Name Display */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-2.5 bg-neutral-900/50 rounded-lg border border-neutral-700">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <PenTool className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                    </div>
                    <span className="flex-1 text-white text-xs lg:text-sm font-semibold truncate">
                      {authorName || "Your name"}
                    </span>
                  </div>
                  <button
                    onClick={handleChangeName}
                    className="p-2 lg:p-2.5 bg-neutral-800 text-neutral-400 rounded hover:bg-neutral-700 hover:text-[#fdb913] transition-colors"
                    title="Change Name"
                  >
                    <Edit2 className="w-3 h-3 lg:w-4 lg:h-4" />
                  </button>
                </div>

                {/* Comment Input Box - WeTransfer Style */}
                <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-2 lg:p-3">
                  {/* Annotation Controls Row - WeTransfer Style */}
                  <div className="flex items-center gap-2 mb-2">
                    {/* Color Swatches - Only show when annotation mode is active */}
                    {isAddingAnnotation && (
                      <div className="flex items-center gap-1">
                        {colors.slice(0, 4).map((c) => (
                          <button
                            key={c}
                            onClick={() => setStrokeColor(c)}
                            className={`w-3 h-3 lg:w-4 lg:h-4 rounded-full border transition-transform hover:scale-110 ${strokeColor === c
                                ? "border-white scale-110"
                                : "border-transparent"
                              }`}
                            style={{ backgroundColor: c }}
                            title={`Select ${c} color`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Annotation Tools - Using Lucide Icons */}
                    <div className="flex items-center gap-1 ml-2">
                      {/* Drawing/Pen Icon - Using Lucide PenTool */}
                      <button
                        onClick={() => {
                          if (reviewStatus === 'APPROVED') {
                            toast.error('Annotations are disabled for approved projects');
                            return;
                          }
                          setIsAddingAnnotation(!isAddingAnnotation);
                          setAnnotationMode(!isAddingAnnotation);
                        }}
                        disabled={reviewStatus === 'APPROVED'}
                        className={`p-1 lg:p-1.5 rounded transition-colors ${isAddingAnnotation
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : reviewStatus === 'APPROVED'
                              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                              : "bg-neutral-700 text-white hover:bg-neutral-600"
                          }`}
                        title={
                          reviewStatus === 'APPROVED'
                            ? "Annotations disabled for approved projects"
                            : isAddingAnnotation
                              ? "Exit annotation mode"
                              : "Add annotation"
                        }
                      >
                        <PenTool className="w-3 h-3" />
                      </button>

                      {/* Separator Line - Only show when colors are visible */}
                      {isAddingAnnotation && (
                        <div className="w-px h-3 lg:h-4 bg-neutral-600"></div>
                      )}

                      {/* Color Drop/Pin Icon - Using Lucide Droplets */}
                      <button
                        onClick={() => {
                          if (reviewStatus === 'APPROVED') {
                            toast.error('Annotations are disabled for approved projects');
                            return;
                          }
                          setIsAddingAnnotation(!isAddingAnnotation);
                          setAnnotationMode(!isAddingAnnotation);
                        }}
                        disabled={reviewStatus === 'APPROVED'}
                        className={`p-1 lg:p-1.5 rounded transition-colors ${isAddingAnnotation
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : reviewStatus === 'APPROVED'
                              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                              : "bg-neutral-700 text-red-500 hover:bg-neutral-600 hover:text-red-400"
                          }`}
                        title={
                          reviewStatus === 'APPROVED'
                            ? "Annotations disabled for approved projects"
                            : isAddingAnnotation
                              ? "Exit annotation mode"
                              : "Add annotation"
                        }
                      >
                        <Droplets className="w-3 h-3" />
                      </button>

                      {/* Trash Can Icon - Using Lucide Trash2 */}
                      {isAddingAnnotation && (
                        <button
                          onClick={handleClearDrawings}
                          className="p-1 lg:p-1.5 rounded bg-neutral-700 text-neutral-400 hover:bg-neutral-600 hover:text-red-400 transition-colors"
                          title="Clear all drawings"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Additional Controls when in annotation mode */}
                    {isAddingAnnotation && (
                      <div className="flex items-center gap-1 lg:gap-2 ml-auto">
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-400 text-xs hidden sm:inline">
                            Size:
                          </span>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={strokeWidth}
                            onChange={(e) =>
                              setStrokeWidth(parseInt(e.target.value))
                            }
                            className="w-8 lg:w-12 accent-[#fdb913]"
                            title="Brush size"
                          />
                          <span className="text-white text-xs w-3 lg:w-4">
                            {strokeWidth}px
                          </span>
                        </div>

                        <button
                          onClick={handleUndo}
                          className="p-1 lg:p-1.5 rounded bg-neutral-700 text-neutral-400 hover:bg-neutral-600 hover:text-white transition-colors"
                          title="Undo"
                        >
                          <Undo className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Text Input Area */}
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder={reviewStatus === 'APPROVED' ? "Comments disabled - Project approved" : "Add comment..."}
                    rows={2}
                    disabled={reviewStatus === 'APPROVED'}
                    className={`w-full bg-transparent text-white text-xs lg:text-sm outline-none placeholder:text-neutral-500 resize-none ${reviewStatus === 'APPROVED' ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                  />
                </div>

                {/* Action Buttons - WeTransfer Style */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsAddingAnnotation(false);
                      setAnnotationMode(false);
                      setNewCommentText("");
                    }}
                    className="px-3 lg:px-4 py-1.5 lg:py-2 text-neutral-400 hover:text-white transition-colors text-xs lg:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitAnnotation}
                    disabled={!newCommentText.trim() || !authorName.trim() || reviewStatus === 'APPROVED' || isSubmittingComment}
                    className="ml-auto px-3 lg:px-4 py-1.5 lg:py-2 bg-[#fdb913] text-black font-bold rounded hover:bg-[#e5a711] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs lg:text-sm flex items-center gap-2"
                  >
                    {isSubmittingComment && <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin" />}
                    {isSubmittingComment 
                      ? "Submitting..." 
                      : reviewStatus === 'APPROVED' 
                        ? "Disabled" 
                        : isAddingAnnotation 
                          ? "Add Annotation" 
                          : "Add"
                    }
                  </button>
                </div>

                {/* Helper Text */}
                {isAddingAnnotation && (
                  <p className="text-xs text-neutral-500 text-center">
                    <span className="hidden sm:inline">
                      Draw on the image using colors above, then add your message
                    </span>
                    <span className="sm:hidden">
                      Draw on image, then add message
                    </span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <WelcomeModal
          onSubmit={handleWelcomeSubmit}
          projectName={projectName}
        />
      )}
    </div>
  );
}
