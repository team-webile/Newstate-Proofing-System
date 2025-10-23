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
  FileText,
} from "lucide-react";
// Removed localStorage imports - now using database APIs
import { WelcomeModal } from "./welcome-modal";
import { useSocket } from "@/contexts/SocketContext";
import toast from 'react-hot-toast';
import { PDFViewer } from "./pdf-viewer";
import dynamic from 'next/dynamic';

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewerDynamic = dynamic(() => import('./pdf-viewer').then(mod => mod.PDFViewer), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-brand-yellow" />
    </div>
  )
});
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
  clientEmail?: string; // Client email for admin notifications
  isAdminView?: boolean; // Is this the admin view
  projectId?: number; // Project ID for email updates
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
  pdfPage?: number; // PDF page number (null for images, 1-based for PDFs)
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
  clientEmail,
  isAdminView = false,
  projectId,
}: DesignViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [annotations, setAnnotations] = useState<Record<number, Annotation[]>>({});
  const [newCommentText, setNewCommentText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
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
  const [currentPdfPage, setCurrentPdfPage] = useState(1); // Current page for PDF files
  const [isPdfFile, setIsPdfFile] = useState(false); // Track if current file is PDF
  const [currentClientEmail, setCurrentClientEmail] = useState(clientEmail); // Track current client email
  const [emailUpdateNotification, setEmailUpdateNotification] = useState(false); // Show email update notification
  const [emailSentNotification, setEmailSentNotification] = useState(false); // Show email sent notification
  const [clientActivityNotification, setClientActivityNotification] = useState(false); // Show client activity notification
  const [clientActivityMessage, setClientActivityMessage] = useState(''); // Client activity message
  const [displayClientEmail, setDisplayClientEmail] = useState(currentClientEmail); // Display email for admin

  const { socket, isConnected } = useSocket();
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // Update client email when prop changes
  useEffect(() => {
    if (clientEmail && clientEmail !== currentClientEmail) {
      setCurrentClientEmail(clientEmail);
      setDisplayClientEmail(clientEmail);
    }
  }, [clientEmail, currentClientEmail]);


  // Join project room and listen for socket events
  useEffect(() => {
    if (socket && isConnected && projectId) {
      // Join project room for real-time updates
      socket.emit('join-project', projectId);
      console.log('📡 Joined project room:', projectId);

      const handleEmailUpdate = (data: { projectId: number; newEmail: string; oldEmail: string }) => {
        console.log('📧 Received clientEmailUpdated event:', data);
        console.log('📧 Current projectId:', projectId);
        console.log('📧 Event projectId:', data.projectId);
        
        if (data.projectId === projectId) {
          setCurrentClientEmail(data.newEmail);
          setDisplayClientEmail(data.newEmail); // Update display email
          setEmailUpdateNotification(true);
          console.log('📧 Client email updated via socket:', data.newEmail);
          console.log('📧 recipientEmail automatically updated to:', data.newEmail);
          console.log('📧 Display email updated to:', data.newEmail);
          
          // Hide notification after 3 seconds
          setTimeout(() => {
            setEmailUpdateNotification(false);
          }, 3000);
        } else {
          console.log('📧 Project ID mismatch, ignoring event');
        }
      };

      // Listen for admin email sent events
      const handleEmailSent = (data: { projectId: number; emailSentTo: string; message: string }) => {
        if (data.projectId === projectId) {
          setEmailSentNotification(true);
          console.log('📧 Admin email sent to:', data.emailSentTo);
          
          // Hide notification after 3 seconds
          setTimeout(() => {
            setEmailSentNotification(false);
          }, 3000);
        }
      };

      // Listen for client activity updates
      const handleClientActivity = (data: { projectId: number; activityType: string; message: string; timestamp: string }) => {
        if (data.projectId === projectId) {
          console.log('📱 Client activity:', data);
          setClientActivityMessage(data.message);
          setClientActivityNotification(true);
          
          // Hide notification after 5 seconds
          setTimeout(() => {
            setClientActivityNotification(false);
          }, 5000);
        }
      };

      // Listen for socket events
      socket.on('clientEmailUpdated', handleEmailUpdate);
      socket.on('adminEmailSent', handleEmailSent);
      socket.on('clientActivity', handleClientActivity);
      
      return () => {
        socket.emit('leave-project', projectId);
        socket.off('clientEmailUpdated', handleEmailUpdate);
        socket.off('adminEmailSent', handleEmailSent);
        socket.off('clientActivity', handleClientActivity);
        console.log('📡 Left project room:', projectId);
      };
    }
  }, [socket, isConnected, projectId]);


  // Annotation state
  const [annotationMode, setAnnotationMode] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const canvasRef = useRef<any>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const selectedItem = designItems[selectedIndex];

  // Helper function to check if file is PDF
  const checkIfPdf = (item: DesignItem) => {
    const fileUrl = item.url || item.file_url || '';
    const fileName = item.name || item.file_name || '';
    const fileType = item.type || '';

    return fileUrl.toLowerCase().endsWith('.pdf') ||
      fileName.toLowerCase().endsWith('.pdf') ||
      fileType.toLowerCase().includes('pdf');
  };

  // Helper function to get absolute URL for files
  const getAbsoluteUrl = (relativeUrl: string) => {
    if (typeof window === 'undefined') return relativeUrl;

    // If already absolute URL, return as is
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl;
    }

    // Convert relative to absolute
    const origin = window.location.origin;
    return `${origin}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
  };

  // Get comments for current item and current PDF page (if PDF)
  const allItemComments = comments[selectedItem.id] || [];
  const itemComments = isPdfFile
    ? allItemComments.filter(c => c.pdfPage === currentPdfPage)
    : allItemComments;

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
        const drawingsMap: Record<number, string> = {};

        for (const item of designItems) {
          // Load comments
          const commentsResponse = await fetch(`/api/comments?designItemId=${item.id}`);
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            commentsMap[item.id] = commentsData.map((c: any) => {
              // Store drawing data separately for overlay display
              if (c.drawingData) {
                drawingsMap[c.id] = c.drawingData;
              }

              return {
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
                createdAt: c.createdAt,
                pdfPage: c.pdfPage || undefined
              };
            });
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
        setAnnotationDrawings(drawingsMap);
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
          createdAt: new Date().toISOString(),
          pdfPage: data.pdfPage || undefined
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

        // Don't auto-scroll - let user stay where they are
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

  // Check if selected item is PDF and reset page when switching files
  useEffect(() => {
    const isPdf = checkIfPdf(selectedItem);
    setIsPdfFile(isPdf);
    setCurrentPdfPage(1); // Reset to page 1 when switching files
    setAnnotationMode(false); // Exit annotation mode when switching files
    setIsAddingAnnotation(false);
  }, [selectedIndex, selectedItem.id]);

  // Check for author name and email, show welcome modal if needed
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("client_proofing_author_name");
      const savedEmail = localStorage.getItem("client_proofing_author_email");
      if (savedName && savedEmail) {
        setAuthorName(savedName);
        setAuthorEmail(savedEmail);
        setShowWelcomeModal(false);
      } else {
        // No name or email found, show welcome modal
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

  const handleWelcomeSubmit = (name: string, email: string) => {
    setAuthorName(name);
    setAuthorEmail(email);
    localStorage.setItem("client_proofing_author_name", name);
    localStorage.setItem("client_proofing_author_email", email);
    setShowWelcomeModal(false);
  };

  const handleChangeName = () => {
 
      localStorage.removeItem("client_proofing_author_name");
      localStorage.removeItem("client_proofing_author_email");
      window.location.reload();
   
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
      // Log the recipientEmail being used for admin notifications
      if (isAdminView && currentClientEmail) {
        console.log('📧 Admin sending email to recipientEmail:', currentClientEmail);
      }
      
      // Save to database via API
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designItemId: selectedItem.id,
          author: authorName,
          authorEmail: authorEmail, // Always use the logged-in user's email
          isAdmin: isAdminView,
          recipientEmail: isAdminView ? currentClientEmail : undefined, // Client email for admin->client notifications
          content: newCommentText,
          type: isAddingAnnotation ? "annotation" : "comment",
          drawingData: drawingData || null,
          canvasPosition: canvasPosition,
          pdfPage: isPdfFile ? currentPdfPage : null
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
          createdAt: savedComment.createdAt,
          pdfPage: savedComment.pdfPage || undefined
        };

        // Update state - use allItemComments to preserve comments from all pages
        setComments({
          ...comments,
          [selectedItem.id]: [...allItemComments, newComment],
        });

        // Don't auto-scroll - let user stay where they are

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
            canvasPosition: canvasPosition,
            pdfPage: savedComment.pdfPage || null
          });

          // Emit client activity for admin notifications
          if (projectId && !isAdminView) {
            socket.emit('client-activity', {
              projectId: projectId,
              activityType: isAddingAnnotation ? 'annotation' : 'comment',
              message: `${savedComment.author} ${isAddingAnnotation ? 'added an annotation' : 'left a comment'}`,
              timestamp: new Date().toISOString()
            });
          }
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
    console.log('Comment clicked:', comment.id, 'Has drawing:', comment.hasDrawing, 'PDF page:', comment.pdfPage);

    if (comment.hasDrawing) {
      // For PDF annotations, navigate to the correct page first
      if (isPdfFile && comment.pdfPage && comment.pdfPage !== currentPdfPage) {
        console.log('Navigating to PDF page:', comment.pdfPage, 'from current page:', currentPdfPage);
        setCurrentPdfPage(comment.pdfPage);
        // Small delay to ensure page loads before showing annotation
        setTimeout(() => {
          setSelectedComment(comment.id);
          console.log('Selected comment after page navigation:', comment.id);
        }, 100);
      } else {
        // Toggle viewing annotation on image/PDF
        if (selectedComment === comment.id) {
          console.log('Hiding annotation for comment:', comment.id);
          setSelectedComment(null); // Hide annotation
        } else {
          console.log('Showing annotation for comment:', comment.id);
          setSelectedComment(comment.id); // Show annotation
        }
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
    <div className="min-h-screen flex flex-col bg-[#1a1a1a]" style={{
      overscrollBehavior: 'contain'
    }}>
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
                {item.url?.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-neutral-400" />
                  </div>
                ) : (
                  <Image
                    src={item.url || item.file_url || "/placeholder.svg"}
                    alt={item.name || item.file_name || "Design file"}
                    width={128}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                )}
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

            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0" style={{ overscrollBehavior: 'contain' }}>
        {/* Image/PDF Display Area with Drawing Canvas */}
        <div className="flex-1 bg-black flex items-center justify-center p-1 lg:p-2 overflow-hidden relative min-h-0 max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-120px)]" style={{ overscrollBehavior: 'contain' }}>
          {isPdfFile ? (
            // PDF Viewer
            <div className="relative w-full h-full">
              {(() => {
                try {
                  return (
                    <PDFViewerDynamic
                      fileUrl={getAbsoluteUrl(selectedItem.url || selectedItem.file_url || "")}
                      currentPage={currentPdfPage}
                      onPageChange={(page) => {
                        setCurrentPdfPage(page);
                        setAnnotationMode(false); // Exit annotation mode when changing pages
                        setIsAddingAnnotation(false);
                      }}
                      className="w-full h-full"
                      enableAnnotations={annotationMode}
                      annotationOverlay={
                        annotationMode ? (
                          <ReactSketchCanvas
                            ref={canvasRef}
                            strokeColor={strokeColor}
                            strokeWidth={strokeWidth}
                            canvasColor="transparent"
                            style={{
                              width: "100%",
                              height: "100%",
                              overscrollBehavior: 'contain',
                              transform: 'translateZ(0)',
                              backfaceVisibility: 'hidden',
                              WebkitTransform: 'translateZ(0)',
                              WebkitBackfaceVisibility: 'hidden'
                            }}
                          />
                        ) : selectedComment && itemComments.find(c => c.id === selectedComment)?.hasDrawing && (
                          (() => {
                            const selectedCommentData = itemComments.find(c => c.id === selectedComment);
                            if (!selectedCommentData) return null;

                            // Check if selected annotation is on current PDF page
                            if (selectedCommentData.pdfPage && selectedCommentData.pdfPage !== currentPdfPage) {
                              return null; // Don't show annotation if it's on a different page
                            }

                            const drawingData = selectedCommentData.drawingData || annotationDrawings[selectedCommentData.id];
                            console.log('Showing selected annotation:', selectedCommentData.id, 'Drawing data available:', !!drawingData);

                            if (!selectedCommentData.canvasPosition) {
                              return (
                                <div className="absolute inset-0 pointer-events-none">
                                  <img
                                    src={drawingData || ""}
                                    alt={`Annotation by ${selectedCommentData.author}`}
                                    className="h-full w-full object-contain"
                                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                                    onError={(e) => {
                                      console.error('Failed to load annotation image:', drawingData);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                    onLoad={() => {
                                      console.log('Annotation image loaded successfully for comment:', selectedCommentData.id);
                                    }}
                                  />
                                </div>
                              );
                            }

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
                                <img
                                  src={drawingData || ""}
                                  alt={`Annotation by ${selectedCommentData.author}`}
                                  className="w-full h-full object-contain"
                                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                                  onError={(e) => {
                                    console.error('Failed to load positioned annotation image:', drawingData);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                  onLoad={() => {
                                    console.log('Positioned annotation image loaded successfully for comment:', selectedCommentData.id);
                                  }}
                                />
                              </div>
                            );
                          })()
                        )
                      }
                    />
                  );
                } catch (error) {
                  console.error('PDF Viewer Error:', error);
                  return (
                    <div className="flex flex-col items-center justify-center h-full bg-neutral-900 rounded-lg">
                      <div className="text-red-400 text-4xl mb-3">⚠️</div>
                      <p className="text-red-400 text-sm text-center">
                        PDF Viewer Error: {error instanceof Error ? error.message : 'Unknown error'}
                      </p>
                    </div>
                  );
                }
              })()}



              {/* Selected Annotation Badge for PDFs */}
              {!annotationMode && selectedComment && itemComments.find(c => c.id === selectedComment)?.hasDrawing && (
                <div className="absolute top-4 right-4 px-2 lg:px-4 py-1 lg:py-2 bg-[#fdb913] text-black rounded-lg font-bold text-xs lg:text-sm shadow-xl flex items-center gap-1 lg:gap-2 animate-pulse">
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
          ) : (
            // Image Viewer
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

              {/* Annotation Mode - Drawing Canvas for Images */}
              {annotationMode && (
                <div className="absolute inset-0" style={{ overscrollBehavior: 'contain' }}>
                  <ReactSketchCanvas
                    ref={canvasRef}
                    strokeColor={strokeColor}
                    strokeWidth={strokeWidth}
                    canvasColor="transparent"
                    style={{
                      width: "100%",
                      height: "100%",
                      overscrollBehavior: 'contain',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                      WebkitTransform: 'translateZ(0)',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                  />
                </div>
              )}

              {/* View Mode - Show Selected Annotation on Image */}
              {!annotationMode && selectedComment && itemComments.find(c => c.id === selectedComment)?.hasDrawing && (
                (() => {
                  const selectedCommentData = itemComments.find(c => c.id === selectedComment);
                  if (!selectedCommentData || selectedCommentData.pdfPage) return null; // Images don't have pdfPage

                  const drawingData = selectedCommentData.drawingData || annotationDrawings[selectedCommentData.id];
                  console.log('Showing selected image annotation:', selectedCommentData.id, 'Drawing data available:', !!drawingData);

                  if (!selectedCommentData.canvasPosition) {
                    return (
                      <div className="absolute inset-0 pointer-events-none">
                        <Image
                          src={drawingData || ""}
                          alt={`Annotation by ${selectedCommentData.author}`}
                          width={1200}
                          height={900}
                          className="h-full w-full object-contain"
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
                        src={drawingData || ""}
                        alt={`Annotation by ${selectedCommentData.author}`}
                        width={1200}
                        height={900}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  );
                })()
              )}

              {/* Annotation Badge */}
              {!annotationMode && selectedComment && itemComments.find(c => c.id === selectedComment)?.hasDrawing && (
                <div className="absolute top-2 left-2 lg:top-4 lg:left-4 px-2 lg:px-4 py-1 lg:py-2 bg-[#fdb913] text-black rounded-lg font-bold text-xs lg:text-sm shadow-xl flex items-center gap-1 lg:gap-2">
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
          )}
        </div>

        {/* Right Sidebar - Comments & Annotations */}
        <div className="w-full lg:w-96 bg-black border-t lg:border-t-0 lg:border-l border-neutral-800 flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)', overscrollBehavior: 'contain' }}>
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
              scrollBehavior: 'auto',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
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
                          {comment.pdfPage && (
                            <span className="px-1.5 lg:px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded font-semibold">
                              Page {comment.pdfPage}
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
          <div className="p-3 lg:p-4 border-t border-neutral-800 space-y-2 lg:space-y-3 flex-shrink-0 bg-black" style={{ overscrollBehavior: 'contain' }}>
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

                {/* Email Update Notification for Admin */}
                {isAdminView && emailUpdateNotification && (
                  <div className="mb-3 p-2 bg-green-900/20 border border-green-500/50 rounded-lg">
                    <p className="text-green-400 text-xs font-medium">
                      ✅ Client email updated automatically
                    </p>
                    <p className="text-green-300 text-xs mt-1">
                      📧 recipientEmail updated to: {displayClientEmail}
                    </p>
                  </div>
                )}

                {/* Email Sent Notification for Admin */}
                {isAdminView && emailSentNotification && (
                  <div className="mb-3 p-2 bg-blue-900/20 border border-blue-500/50 rounded-lg">
                    <p className="text-blue-400 text-xs font-medium">
                      📧 Email sent to updated client address
                    </p>
                  </div>
                )}

                {/* Current Recipient Email Display for Admin */}
                {isAdminView && displayClientEmail && (
                  <div className="mb-3 p-2 bg-neutral-800/50 border border-neutral-600 rounded-lg">
                    <p className="text-neutral-300 text-xs font-medium">
                      📧 Emails will be sent to: {displayClientEmail}
                    </p>
                  </div>
                )}

                {/* Client Activity Notification for Admin */}
                {isAdminView && clientActivityNotification && (
                  <div className="mb-3 p-2 bg-purple-900/20 border border-purple-500/50 rounded-lg">
                    <p className="text-purple-400 text-xs font-medium">
                      📱 {clientActivityMessage}
                    </p>
                  </div>
                )}

                {/* Name Display */}
                <div className="flex items-center gap-2" style={{ overscrollBehavior: 'contain' }}>
                  <div className="flex-1 flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-2.5 bg-neutral-900/50 rounded-lg border border-neutral-700" style={{ overscrollBehavior: 'contain' }}>
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
                    <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                  </button>
                  
                </div>

                {/* Comment Input Box - WeTransfer Style */}
                <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-2 lg:p-3" style={{ overscrollBehavior: 'contain' }}>
                  {/* Annotation Controls Row - WeTransfer Style */}
                  <div className="flex items-center gap-2 mb-2" style={{ overscrollBehavior: 'contain' }}>
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
                    style={{
                      overscrollBehavior: 'contain',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                      WebkitTransform: 'translateZ(0)',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                    onFocus={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onBlur={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                </div>

                {/* Action Buttons - WeTransfer Style */}
                <div className="flex gap-2" style={{ overscrollBehavior: 'contain' }}>
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
            clientEmail={clientEmail}
            projectId={projectId}
          />
        )}
    </div>
  );
}
