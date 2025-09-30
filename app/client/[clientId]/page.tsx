"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import {
  Download,
  Eye,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Moon,
  Sun,
  PenTool,
  X,
} from "lucide-react";
// Dialog imports removed - no longer using annotation modal
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import io from "socket.io-client";

interface ClientDashboardProps {
  params: {
    clientId: string;
  };
}

interface ProjectFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  version: string;
}

interface ClientProject {
  id: string;
  title: string;
  description: string;
  status: string;
  downloadEnabled: boolean;
  emailNotifications: boolean;
  createdAt: string;
  lastActivity: string;
  client: {
    id: string;
    name: string;
    company?: string;
  };
  files: ProjectFile[];
  publicLink: string;
}

export default function ClientDashboard({ params }: ClientDashboardProps) {
  const [project, setProject] = useState<ClientProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [annotations, setAnnotations] = useState<{ [key: string]: string[] }>(
    {}
  );
  // Removed annotation modal states
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
  const [showChat, setShowChat] = useState(true);
  const [files, setFiles] = useState<ProjectFile[]>([]);

  // Get project ID from URL search params
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    // Get project ID from URL search params
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const projectParam = urlParams.get("project");
      setProjectId(projectParam);

      // Initialize dark mode from localStorage
      const savedTheme = localStorage.getItem("client-theme");
      if (savedTheme === "dark") {
        setIsDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (typeof window !== "undefined") {
      if (newDarkMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("client-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("client-theme", "light");
      }
    }
  };

  // Fetch project data
  const fetchProject = async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/client/project/${projectId}?clientId=${params.clientId}`
      );
      const data = await response.json();

      if (data.status === "success") {
        setProject(data.data);
        // Also fetch files from the project files API
        await fetchProjectFiles();
      } else {
        setError(data.message || "Failed to load project");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      setError("Failed to load project");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch project files
  const fetchProjectFiles = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/files`);
      const data = await response.json();

      if (data.status === "success") {
        setFiles(data.data.files || []);
      } else {
        console.error("Failed to fetch project files:", data.message);
      }
    } catch (error) {
      console.error("Error fetching project files:", error);
    }
  };

  // Fetch annotations from database
  const fetchAnnotations = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/annotations?projectId=${projectId}`);
      const data = await response.json();

      if (data.status === "success") {
        // Group annotations by fileId
        const annotationsByFile: { [key: string]: string[] } = {};
        data.data.forEach((annotation: any) => {
          if (!annotationsByFile[annotation.fileId]) {
            annotationsByFile[annotation.fileId] = [];
          }
          annotationsByFile[annotation.fileId].push(annotation.content);
        });
        setAnnotations(annotationsByFile);
      }
    } catch (error) {
      console.error("Error fetching annotations:", error);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchAnnotations();
    }
  }, [projectId, params.clientId]);

  // Initialize Socket.io
  useEffect(() => {
    if (projectId && params.clientId) {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
        path: "/api/socketio",
        transports: ["websocket", "polling"],
      });

      setSocket(newSocket);

      // Join project room
      newSocket.emit("join-project", projectId);

      // Listen for annotation updates
      newSocket.on(
        "annotationAdded",
        (data: {
          fileId: string;
          annotation: string;
          timestamp: string;
          addedBy?: string;
          addedByName?: string;
        }) => {
          setAnnotations((prev) => ({
            ...prev,
            [data.fileId]: [...(prev[data.fileId] || []), data.annotation],
          }));

          // Add to chat messages with sender/receiver info
          const senderName = data.addedByName || data.addedBy || "Unknown";
          const isFromClient =
            senderName.includes("Client") ||
            senderName === project?.client?.name;
          const messageText = isFromClient
            ? `You sent: "${data.annotation}"`
            : `Received from ${senderName}: "${data.annotation}"`;

          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: "annotation",
              message: messageText,
              timestamp: data.timestamp,
              addedBy: senderName,
              senderName: senderName,
              isFromClient: isFromClient,
            },
          ]);
        }
      );

      // Listen for status changes
      newSocket.on(
        "statusChanged",
        (data: { status: string; message: string; timestamp: string }) => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: "status",
              message: data.message,
              timestamp: data.timestamp,
            },
          ]);

          // Hide chat when status changes
          setShowChat(false);

          // Update project status
          setProject((prev) =>
            prev ? { ...prev, status: data.status } : null
          );
        }
      );

      // Listen for dummy success messages
      newSocket.on(
        "dummySuccessMessage",
        (data: {
          type: string;
          message: string;
          from: string;
          to: string;
          timestamp: string;
        }) => {
          console.log("💬 CLIENT received dummy success message:", data);
          
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: "status",
              message: data.message,
              timestamp: data.timestamp,
              addedBy: data.from,
              senderName: data.from,
              isFromClient: data.to === "Client",
            },
          ]);
        }
      );

      // Listen for review status updates
      newSocket.on(
        "reviewStatusUpdated",
        (data: {
          reviewId: string;
          projectId: string;
          status: string;
          message: string;
          timestamp: string;
          isFromAdmin: boolean;
        }) => {
          console.log("📊 Review status updated:", data);
          
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: "status",
              message: data.message,
              timestamp: data.timestamp,
              addedBy: data.isFromAdmin ? "Admin" : "Client",
              senderName: data.isFromAdmin ? "Admin" : "Client",
              isFromClient: !data.isFromAdmin,
            },
          ]);

          // Update project status
          setProject((prev) =>
            prev ? { ...prev, status: data.status } : null
          );
        }
      );

      return () => {
        newSocket.emit("leave-project", projectId);
        newSocket.close();
      };
    }
  }, [projectId, params.clientId]);

  // Helper functions
  const isImageFile = (file: ProjectFile) => {
    return file.type.startsWith("image/");
  };

  const openReviewPage = (file: ProjectFile) => {
    // Redirect to review page with file ID
    window.location.href = `/review/${projectId}?fileId=${file.id}`;
  };

  // addAnnotation function removed - now using review page for annotations

  const removeAnnotation = (fileId: string, index: number) => {
    setAnnotations((prev) => ({
      ...prev,
      [fileId]: prev[fileId]?.filter((_, i) => i !== index) || [],
    }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-gray-300">
            Loading project...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground dark:text-white mb-2">
            Project Not Found
          </h1>
          <p className="text-muted-foreground dark:text-gray-300 mb-4">
            {error ||
              "The project you are looking for does not exist or you do not have access to it."}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Helper functions
  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "Image";
    if (mimeType === "application/pdf") return "PDF";
    if (mimeType === "image/vnd.adobe.photoshop") return "PSD";
    if (mimeType === "application/postscript") return "Vector";
    return "File";
  };

  const getFileStatus = (file: ProjectFile) => {
    // For now, all files are pending review
    // TODO: Implement actual status tracking
    return "pending";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Transform files into project elements for display
  const projectElements = files.map((file, index) => ({
    id: file.id,
    name: file.name,
    type: getFileType(file.type),
    status: getFileStatus(file),
    thumbnail: file.url,
    comments: annotations[file.id]?.length || 0,
    lastUpdated: formatDate(file.uploadedAt),
    file: file, // Include the full file object
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "revisions":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "approved":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "revisions":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-border bg-card dark:bg-gray-900 dark:border-gray-700">
        <div className="flex h-16 items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-white"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground dark:text-gray-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
              APPROVE PROJECT
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">
            {project.title}
          </h1>
          <p className="text-muted-foreground dark:text-gray-300 max-w-4xl">
            {project.description ||
              "Please review the project files and provide your feedback."}
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
            <span>Client: {project.client.firstName} {project.client.lastName}</span>
            <span>•</span>
            <span>Status: {project.status}</span>
            <span>•</span>
            <span>Last Activity: {formatDate(project.lastActivity)}</span>
          </div>
        </div>

        {/* Project Elements Grid */}
        {projectElements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {projectElements.map((element) => (
              <Card
                key={element.id}
                className="border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer group dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <CardHeader className="p-0">
                  <div className="relative aspect-[3/2] overflow-hidden rounded-t-lg">
                    <img
                      src={element.thumbnail || "/placeholder.svg"}
                      alt={element.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute top-2 right-2">
                      {getStatusIcon(element.status)}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            window.open(element.thumbnail, "_blank")
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openReviewPage(element.file)}
                        >
                          <PenTool className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-card-foreground dark:text-white text-sm">
                        {element.name}
                      </h3>
                      <p className="text-xs text-muted-foreground dark:text-gray-400">
                        {element.type}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(element.status)}>
                        {element.status}
                      </Badge>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-gray-400">
                        {element.comments > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {element.comments}
                          </div>
                        )}
                        <span>{element.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-muted dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Eye className="h-8 w-8 text-muted-foreground dark:text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">
              No Files Yet
            </h3>
            <p className="text-muted-foreground dark:text-gray-300">
              The project files haven't been uploaded yet. Please check back
              later.
            </p>
          </div>
        )}

        {/* Chat Messages */}
        {showChat && chatMessages.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Project Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.type === "status"
                          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                          : "bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={
                            message.type === "status" ? "default" : "secondary"
                          }
                        >
                          {message.type === "status"
                            ? "Status Update"
                            : "Annotation"}
                        </Badge>
                        {message.senderName && (
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                message.isFromClient
                                  ? "bg-green-500"
                                  : "bg-blue-500"
                              }`}
                            ></div>
                            <span className="text-xs font-medium text-foreground">
                              {message.isFromClient
                                ? "You"
                                : message.senderName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {message.isFromClient ? "sent" : "received"}
                            </span>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Need help? Contact us at{" "}
            <a
              href="mailto:support@newstatebranding.com"
              className="text-primary hover:underline dark:text-white"
            >
              support@newstatebranding.com
            </a>
          </p>
        </div>
      </main>

      {/* Annotation Modal removed - now using review page */}
    </div>
  );
}
