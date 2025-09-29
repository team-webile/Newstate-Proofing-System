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
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  PenTool,
  X,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Upload,
  Download,
  Eye,
} from "lucide-react";
import ImageAnnotation from "@/components/ImageAnnotation";
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

interface Annotation {
  id: string;
  x: number;
  y: number;
  comment: string;
  timestamp: string;
  resolved: boolean;
  fileId: string;
  addedBy?: string;
  addedByName?: string;
}

interface ProjectFile {
  id: string;
  name: string;
  url: string;
  fullUrl: string;
  type: string;
  size: number;
  uploadedAt: string;
  version: string;
  status?: string;
}

interface Version {
  id: string;
  version: string;
  files: ProjectFile[];
  status: "draft" | "pending_review" | "approved" | "rejected" | "in_revision";
  createdAt: string;
  annotations: Annotation[];
  revisionNotes?: string;
}

interface Revision {
  id: string;
  version: string;
  status: "in_revision" | "pending_review" | "approved" | "rejected";
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
    shareLink: string;
  };
}

export default function ClientReviewPage({ params }: ReviewPageProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [fileAnnotations, setFileAnnotations] = useState<{
    [key: string]: string[];
  }>({});
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProjectFile | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      type: "annotation" | "status";
      message: string;
      timestamp: string;
      addedBy?: string;
      senderName?: string;
      isFromClient?: boolean;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionComment, setRevisionComment] = useState("");
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signature, setSignature] = useState({ firstName: "", lastName: "" });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Current user (Client)
  const currentUser = {
    name: "Client User",
    role: "CLIENT",
  };

  // Use real-time comments hook
  const {
    comments,
    annotations: realtimeAnnotations,
    isLoading: commentsLoading,
    error: commentsError,
    isConnected: socketConnected,
    addComment,
    addAnnotation,
    resolveAnnotation,
  } = useRealtimeComments({
    projectId: review?.project?.id || "",
    fileId: selectedFile?.id,
    currentUser,
  });

  // Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io(env.NEXT_PUBLIC_SOCKET_URL, {
      path: "/api/socketio",
      transports: ["websocket", "polling"],
    });

    setSocket(newSocket);

    // Handle connection status
    newSocket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    // Join project room
    if (review?.project?.id) {
      newSocket.emit("join-project", review.project.id);
    }

    // Listen for real-time updates
    newSocket.on("annotationAdded", (data) => {
      console.log("Real-time annotation added:", data);
      setLastUpdate(data.timestamp);
    });

    newSocket.on("annotationReplyAdded", (data) => {
      console.log("Real-time annotation reply added:", data);
      setLastUpdate(data.timestamp);
    });

    newSocket.on("statusChanged", (data) => {
      console.log("Real-time status changed:", data);
      setLastUpdate(data.timestamp);
    });

    return () => {
      newSocket.emit("leave-project", review?.project?.id);
      newSocket.close();
    };
  }, [review?.project?.id]);

  // Fetch review data
  const fetchReview = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/share/${params.shareLink}`);
      const data = await response.json();

      if (data.status === "success") {
        setReview(data.data);
        if (data.data.project.files && data.data.project.files.length > 0) {
          setSelectedFile(data.data.project.files[0]);
        }
      } else {
        setError(data.message || "Failed to load review");
      }
    } catch (err) {
      console.error("Error fetching review:", err);
      setError("Failed to load review");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [params.shareLink]);

  const handleFileSelect = (file: any) => {
    setSelectedFile(file);
    setSelectedImage(file);
  };

  const handleVersionSelect = (version: Version) => {
    setSelectedVersion(version);
    if (version.files && version.files.length > 0) {
      setSelectedFile(version.files[0]);
    }
  };

  const isImageFile = (file: ProjectFile) => {
    return file.type.startsWith("image/");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_revision":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <X className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedFile) return;

    try {
      const response = await fetch(`/api/elements/${selectedFile.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setSelectedFile((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );

        // Emit socket event
        if (socket && review?.project?.id) {
          socket.emit("updateElementStatus", {
            projectId: review.project.id,
            elementId: selectedFile.id,
            status: newStatus,
            message: `Status changed to ${newStatus}`,
          });
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleRevisionRequest = async () => {
    if (!revisionComment.trim()) return;

    try {
      const response = await fetch("/api/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: review.project.id,
          comment: revisionComment,
          requestedBy: currentUser.name,
        }),
      });

      if (response.ok) {
        setShowRevisionDialog(false);
        setRevisionComment("");
        // Refresh data
        fetchReview();
      }
    } catch (error) {
      console.error("Error requesting revision:", error);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!selectedFile) return;

    try {
      const response = await fetch(`/api/elements/${selectedFile.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved,
          signature: `${signature.firstName} ${signature.lastName}`,
          comment: revisionComment,
        }),
      });

      if (response.ok) {
        setShowSignatureDialog(false);
        setSignature({ firstName: "", lastName: "" });
        setRevisionComment("");
        // Refresh data
        fetchReview();
      }
    } catch (error) {
      console.error("Error approving/rejecting:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading review...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Review</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchReview}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Review Not Found</h2>
          <p className="text-muted-foreground">
            The review you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  NSB
                </span>
              </div>
              <div>
                <h1 className="text-xl font-semibold">
                  {review.project.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Client Review -{" "}
                  {review.project.client?.name || "Unknown Client"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">Client Access</Badge>
              <Badge variant="secondary">{review.project.status}</Badge>
              <Badge variant="outline">
                {review.project.files?.length || 0} Files
              </Badge>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "🟢 Live" : "🔴 Offline"}
              </Badge>
              {lastUpdate && (
                <Badge variant="outline" className="text-xs">
                  Last update: {new Date(lastUpdate).toLocaleTimeString()}
                </Badge>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Files Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Files</CardTitle>
                  <CardDescription>Select a file to review</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {review.project.files?.map((file: ProjectFile) => (
                    <Button
                      key={file.id}
                      variant={
                        selectedFile?.id === file.id ? "default" : "outline"
                      }
                      className="w-full justify-start h-auto p-3"
                      onClick={() => handleFileSelect(file)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                          {isImageFile(file) ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <Icons.FolderOpen />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)} • {file.type}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Project Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Project</Label>
                    <p className="text-sm text-muted-foreground">
                      {review.project.title}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Client</Label>
                    <p className="text-sm text-muted-foreground">
                      {review.project.client?.name || "Unknown Client"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getStatusColor(review.project.status)}>
                      {getStatusIcon(review.project.status)}
                      <span className="ml-1">{review.project.status}</span>
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Files</Label>
                    <p className="text-sm text-muted-foreground">
                      {review.project.files?.length || 0} files
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Review Area */}
            <div className="lg:col-span-3 space-y-6">
              {selectedFile && isImageFile(selectedFile) ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {selectedFile.name}
                      <div className="flex gap-2">
                        <Badge
                          className={getStatusColor(
                            selectedFile.status || "pending"
                          )}
                        >
                          {getStatusIcon(selectedFile.status || "pending")}
                          <span className="ml-1">
                            {selectedFile.status || "Pending"}
                          </span>
                        </Badge>
                        <AlertDialog
                          open={showStatusDialog}
                          onOpenChange={setShowStatusDialog}
                        >
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Change Status
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Change File Status
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Select the new status for this file.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="status">Status</Label>
                                <Select onValueChange={handleStatusChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="approved">
                                      Approved
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                      Rejected
                                    </SelectItem>
                                    <SelectItem value="pending">
                                      Pending
                                    </SelectItem>
                                    <SelectItem value="in_revision">
                                      In Revision
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => setShowStatusDialog(false)}
                              >
                                Update Status
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Click anywhere on the image to add annotations and
                      feedback
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageAnnotation
                      imageUrl={selectedFile.fullUrl}
                      imageAlt={selectedFile.name}
                      fileId={selectedFile.id}
                      projectId={review.project.id}
                      annotations={realtimeAnnotations}
                      onAnnotationAdd={addAnnotation}
                      onAnnotationResolve={resolveAnnotation}
                      isAdmin={false}
                      currentUser={currentUser}
                    />
                  </CardContent>
                </Card>
              ) : selectedFile ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedFile.name}</CardTitle>
                    <CardDescription>
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                      <div className="text-center">
                        <Icons.FolderOpen />
                        <p className="text-muted-foreground">
                          Preview not available for this file type
                        </p>
                        <Button variant="outline" className="mt-4">
                          <Download className="h-4 w-4 mr-2" />
                          Download File
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Icons.FolderOpen />
                      <p className="text-muted-foreground">
                        Select a file to review
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comments Section */}
              {selectedFile && comments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Comments & Feedback</CardTitle>
                    <CardDescription>
                      All comments for this file
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-medium">
                                  {comment.userName}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {comment.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">{comment.commentText}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              {selectedFile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>
                      Approve, reject, or request revisions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowSignatureDialog(true)}
                        className="flex-1"
                        variant="outline"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => setShowRevisionDialog(true)}
                        className="flex-1"
                        variant="outline"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Request Revision
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Digital Signature</DialogTitle>
            <DialogDescription>
              Please provide your signature to approve this file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={signature.firstName}
                  onChange={(e) =>
                    setSignature((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={signature.lastName}
                  onChange={(e) =>
                    setSignature((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                value={revisionComment}
                onChange={(e) => setRevisionComment(e.target.value)}
                placeholder="Add any additional comments..."
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
            <Button onClick={() => handleApproval(true)}>Approve File</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              Please provide details about the changes you need.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="revisionComment">Revision Comments</Label>
              <Textarea
                id="revisionComment"
                value={revisionComment}
                onChange={(e) => setRevisionComment(e.target.value)}
                placeholder="Describe the changes needed..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRevisionDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRevisionRequest}>Request Revision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
