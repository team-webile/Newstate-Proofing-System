"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { Icons } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { LogoutButton } from "@/components/logout-button";
import { Eye, MessageSquare, PenTool, X, FileText } from "lucide-react";
import io from "socket.io-client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface ProjectFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  version: string;
}

interface Version {
  id: string;
  version: string;
  files: ProjectFile[];
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  createdAt: string;
  notes?: string;
  clientFeedback?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  comparisonNotes?: string;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
  description: string;
  allowDownloads: boolean;
  emailNotifications: boolean;
  publicLink: string;
  status:
    | "draft"
    | "pending"
    | "approved"
    | "revisions"
    | "active"
    | "archived"
    | "completed";
  createdAt: string;
  lastActivity: string;
}

interface Client {
  id: string;
  name: string;
  company?: string;
}

interface ProjectFilesPageProps {
  params: {
    projectId: string;
  };
}

export default function ProjectFilesPage({ params }: ProjectFilesPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<Version[]>([
    {
      id: "1",
      version: "V1",
      files: [],
      status: "draft",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [currentVersion, setCurrentVersion] = useState("V1");
  const [isUploading, setIsUploading] = useState(false);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newVersionName, setNewVersionName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProjectFile | null>(null);
  const [annotations, setAnnotations] = useState<{ [key: string]: string[] }>(
    {}
  );
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [selectedFileForDetails, setSelectedFileForDetails] =
    useState<ProjectFile | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      type: "annotation" | "status";
      message: string;
      timestamp: string;
      addedBy?: string;
      senderName?: string;
      isFromAdmin?: boolean;
    }>
  >([]);
  const [shareLink, setShareLink] = useState<string | null>(null);

  // Fetch clients data
  const fetchClients = async () => {
    try {
      setClientsLoading(true);
      const response = await fetch("/api/clients");
      const data = await response.json();

      if (data.status === "success") {
        console.log("Clients data:", data.data);
        setClients(Array.isArray(data.data) ? data.data : []);
      } else {
        setClientsError(data.message || "Failed to fetch clients");
        setClients([]); // Ensure clients is always an array
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClientsError("Failed to fetch clients");
      setClients([]); // Ensure clients is always an array
    } finally {
      setClientsLoading(false);
    }
  };

  // Fetch project data
  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.projectId}`);
      const data = await response.json();

      if (data.status === "success") {
        const projectInfo = data.data;
        const projectWithLink = {
          id: projectInfo.id,
          name: projectInfo.title,
          clientId: projectInfo.clientId,
          description: projectInfo.description || "",
          allowDownloads: projectInfo.downloadEnabled,
          emailNotifications: projectInfo.emailNotifications ?? true,
          publicLink: `${window.location.origin}/client/${projectInfo.clientId}?project=${projectInfo.id}`,
          status: projectInfo.status.toLowerCase(),
          createdAt: projectInfo.createdAt,
          lastActivity: projectInfo.lastActivity
            ? new Date(projectInfo.lastActivity).toLocaleDateString()
            : "Unknown",
        };
        setProject(projectWithLink);
      } else {
        console.error("Failed to fetch project:", data.message);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  // Generate share link
  const generateShareLink = async () => {
    try {
      const response = await fetch(
        `/api/projects/${params.projectId}/share-link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();

      if (data.status === "success") {
        setShareLink(data.data.shareLink);
      }
    } catch (error) {
      console.error("Error generating share link:", error);
    }
  };

  // Fetch project files
  const fetchProjectFiles = async () => {
    try {
      const response = await fetch(`/api/projects/${params.projectId}/files`);
      const data = await response.json();

      if (data.status === "success") {
        console.log("Project files:", data.data);

        // If we have files, update the versions with real data
        if (data.data.files && Array.isArray(data.data.files)) {
          const files = data.data.files.map((file: any) => ({
            id: file.id || Date.now().toString(),
            name: file.name,
            url: file.url,
            type: file.type,
            size: file.size,
            uploadedAt: file.uploadedAt,
            version: file.version || "V1",
          }));

          // Group files by version
          const filesByVersion: { [key: string]: ProjectFile[] } = {};
          files.forEach((file: ProjectFile) => {
            if (!filesByVersion[file.version]) {
              filesByVersion[file.version] = [];
            }
            filesByVersion[file.version].push(file);
          });

          // Update versions with their respective files, preserving existing version data
          setVersions((prev) =>
            prev.map((v) => ({
              ...v,
              files: filesByVersion[v.version] || [],
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching project files:", error);
    }
  };

  // Fetch versions from database
  const fetchVersions = async () => {
    try {
      const response = await fetch(
        `/api/projects/${params.projectId}/versions`
      );
      const data = await response.json();

      if (data.status === "success" && data.data && data.data.length > 0) {
        const versionsFromDb = data.data.map((version: any) => ({
          id: version.id,
          version: version.version,
          files: [], // Will be populated by fetchProjectFiles
          status: version.status || "DRAFT",
          createdAt: version.createdAt,
        }));
        setVersions(versionsFromDb);
      } else {
        // If no versions from database, initialize with default V1
        setVersions([
          {
            id: "1",
            version: "V1",
            files: [],
            status: "DRAFT",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching versions:", error);
      // Fallback to default V1 if error
      setVersions([
        {
          id: "1",
          version: "V1",
          files: [],
          status: "DRAFT",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  // Fetch annotations from database
  const fetchAnnotations = async () => {
    try {
      const response = await fetch(
        `/api/annotations?projectId=${params.projectId}`
      );
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
    const fetchData = async () => {
      await Promise.all([
        fetchProject(),
        fetchClients(),
        fetchVersions(),
        fetchAnnotations(),
      ]);

      // Fetch files after versions are loaded to properly associate them
      await fetchProjectFiles();
      setIsLoading(false);
    };

    fetchData();
  }, [params.projectId]);

  // Initialize Socket.io
  useEffect(() => {
    if (params.projectId) {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        path: "/api/socketio",
        transports: ["websocket", "polling"],
      });

      setSocket(newSocket);

      // Join project room
      newSocket.emit("join-project", params.projectId);

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
          const isFromAdmin =
            senderName.includes("Admin") || senderName === "Admin User";
          const messageText = isFromAdmin
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
              isFromAdmin: isFromAdmin,
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
          console.log("💬 ADMIN received dummy success message:", data);
          
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: "status",
              message: data.message,
              timestamp: data.timestamp,
              addedBy: data.from,
              senderName: data.from,
              isFromAdmin: data.to === "Admin",
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
          console.log("📊 Admin received review status update:", data);
          
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: "status",
              message: data.message,
              timestamp: data.timestamp,
              addedBy: data.isFromAdmin ? "Admin" : "Client",
              senderName: data.isFromAdmin ? "Admin" : "Client",
              isFromAdmin: data.isFromAdmin,
            },
          ]);

          // Update project status
          setProject((prev) =>
            prev ? { ...prev, status: data.status } : null
          );
        }
      );

      return () => {
        newSocket.emit("leave-project", params.projectId);
        newSocket.close();
      };
    }
  }, [params.projectId]);

  const handleFileUpload = async (file: File) => {
    if (!project) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("version", currentVersion);

      const response = await fetch(`/api/projects/${project.id}/files`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.status === "success") {
        const uploadedFile: ProjectFile = {
          id: data.data.id,
          name: data.data.name,
          url: data.data.url,
          type: data.data.type,
          size: data.data.size,
          uploadedAt: data.data.uploadedAt,
          version: currentVersion, // Use current version instead of server response
        };

        // Add file only to the current version
        setVersions((prev) =>
          prev.map((v) =>
            v.version === currentVersion
              ? { ...v, files: [...v.files, uploadedFile] }
              : v
          )
        );

        // Show success message
        toast({
          title: "Success",
          description: "File uploaded successfully!",
        });

        // Refresh files after successful upload
        await fetchProjectFiles();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to upload file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setNewFile(null);
      setShowFileDialog(false);
    }
  };

  const handleFileRemove = async (fileId: string) => {
    if (!project) return;

    try {
      // Find the file to get its name
      const currentVersionData = versions.find(
        (v) => v.version === currentVersion
      );
      const fileToDelete = currentVersionData?.files.find(
        (file) => file.id === fileId
      );

      if (!fileToDelete) {
        toast({
          title: "Error",
          description: "File not found",
          variant: "destructive",
        });
        return;
      }

      // Extract filename from URL (e.g., "/uploads/projects/.../filename.jpg" -> "filename.jpg")
      const fileName = fileToDelete.url.split("/").pop();

      if (!fileName) {
        toast({
          title: "Error",
          description: "Invalid file name",
          variant: "destructive",
        });
        return;
      }

      // Call delete API with version parameter
      const response = await fetch(
        `/api/projects/${project.id}/files?fileName=${encodeURIComponent(
          fileName
        )}&version=${encodeURIComponent(currentVersion)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        // Remove file from frontend state - only from current version
        setVersions((prev) =>
          prev.map((v) =>
            v.version === currentVersion
              ? { ...v, files: v.files.filter((file) => file.id !== fileId) }
              : v
          )
        );
        toast({
          title: "Success",
          description: "File deleted successfully!",
        });

        // Refresh files after successful deletion
        await fetchProjectFiles();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateVersion = async () => {
    if (!newVersionName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a version name",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save version to database
      const response = await fetch(
        `/api/projects/${params.projectId}/versions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            version: newVersionName,
            description: `Version ${newVersionName}`,
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        const newVersion: Version = {
          id: Date.now().toString(),
          version: newVersionName,
          files: [],
          status: "DRAFT",
          createdAt: new Date().toISOString(),
        };

        setVersions((prev) => [...prev, newVersion]);
        setCurrentVersion(newVersionName);
        setNewVersionName("");
        setShowVersionDialog(false);

        toast({
          title: "Success",
          description: `Version ${newVersionName} created successfully!`,
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create version",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating version:", error);
      toast({
        title: "Error",
        description: "Failed to create version. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVersionChange = (version: string) => {
    setCurrentVersion(version);
  };

  const handlePublishVersion = () => {
    setVersions((prev) =>
      prev.map((v) =>
        v.version === currentVersion
          ? { ...v, status: "PENDING_REVIEW" as const }
          : v
      )
    );

    // Update project status
    setProject((prev) =>
      prev ? { ...prev, status: "pending" as const } : null
    );

    toast({
      title: "Success",
      description: "Version published for client review!",
    });
  };

  const handleApproveVersion = async (versionId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${params.projectId}/versions/${versionId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvedBy: "Admin User", // This should come from auth context
            approvedAt: new Date().toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setVersions((prev) =>
          prev.map((v) =>
            v.id === versionId
              ? {
                  ...v,
                  status: "APPROVED" as const,
                  approvedBy: "Admin User",
                  approvedAt: new Date().toISOString(),
                }
              : v
          )
        );

        toast({
          title: "Success",
          description: "Version approved successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to approve version",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error approving version:", error);
      toast({
        title: "Error",
        description: "Failed to approve version. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectVersion = async (versionId: string, feedback: string) => {
    try {
      const response = await fetch(
        `/api/projects/${params.projectId}/versions/${versionId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rejectedBy: "Admin User", // This should come from auth context
            rejectedAt: new Date().toISOString(),
            clientFeedback: feedback,
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setVersions((prev) =>
          prev.map((v) =>
            v.id === versionId
              ? {
                  ...v,
                  status: "REJECTED" as const,
                  rejectedBy: "Admin User",
                  rejectedAt: new Date().toISOString(),
                  clientFeedback: feedback,
                }
              : v
          )
        );

        toast({
          title: "Success",
          description: "Version rejected with feedback!",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to reject version",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error rejecting version:", error);
      toast({
        title: "Error",
        description: "Failed to reject version. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProject = async () => {
    if (!project) return;

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: project.name,
          description: project.description,
          status: project.status.toUpperCase(),
          downloadEnabled: project.allowDownloads,
          clientId: project.clientId,
          emailNotifications: project.emailNotifications,
        }),
      });

      const data = await response.json();
      if (data.status === "success") {
        toast({
          title: "Success",
          description: "Project settings saved successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to save project",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: "Failed to save project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isImageFile = (file: ProjectFile) => {
    return file.type.startsWith("image/");
  };

  const openAnnotationModal = (file: ProjectFile) => {
    setSelectedImage(file);
    setShowAnnotationModal(true);
  };

  const openViewDetailsModal = (file: ProjectFile) => {
    setSelectedFileForDetails(file);
    setShowViewDetailsModal(true);
  };

  const addAnnotation = async (fileId: string, annotation: string) => {
    if (!annotation.trim()) return;

    try {
      // Get current user info (you can implement proper auth later)
      const currentUser = {
        name: "Admin User", // This should come from authentication context
        role: "Admin",
      };

      // Save to database
      const response = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: annotation,
          fileId,
          projectId: params.projectId,
          addedBy: currentUser.role,
          addedByName: currentUser.name,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        // Update local state
        setAnnotations((prev) => ({
          ...prev,
          [fileId]: [...(prev[fileId] || []), annotation],
        }));

        // Emit to Socket.io
        if (socket && params.projectId) {
          socket.emit("addAnnotation", {
            projectId: params.projectId,
            fileId,
            annotation,
            addedBy: currentUser.role,
            addedByName: currentUser.name,
          });
        }
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

  const removeAnnotation = (fileId: string, index: number) => {
    setAnnotations((prev) => ({
      ...prev,
      [fileId]: prev[fileId]?.filter((_, i) => i !== index) || [],
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "approved":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "revisions":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "draft":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getVersionStatusColor = (status: string) => {
    switch (status) {
      case "PENDING_REVIEW":
        return "bg-blue-500";
      case "APPROVED":
        return "bg-green-500";
      case "REJECTED":
        return "bg-red-500";
      case "DRAFT":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getVersionStatusText = (status: string) => {
    switch (status) {
      case "PENDING_REVIEW":
        return "Pending Review";
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      case "DRAFT":
        return "Draft";
      default:
        return "Unknown";
    }
  };

  const currentVersionData = versions.find((v) => v.version === currentVersion);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 text-muted-foreground mx-auto mb-4">
            <Icons.FolderOpen />
          </div>
          <h3 className="text-lg font-medium mb-2">Project not found</h3>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist.
          </p>
          <Button onClick={() => (window.location.href = "/admin/projects")}>
            Back to Projects
          </Button>
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
              onClick={() => (window.location.href = "/admin/projects")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icons.ArrowLeft />
              <span className="ml-2">Back to Projects</span>
            </Button>
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <LogoutButton />
            <Button
              onClick={handleSaveProject}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Icons.Save />
              <span className="ml-2">Save Changes</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {project.name}
                </h1>
                <p className="text-muted-foreground">
                  Manage files and versions for client review
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/admin/projects/${params.projectId}/files/annotations`
                    )
                  }
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Client Feedback
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File Management */}
            <div className="lg:col-span-2 space-y-6">
              {/* Version Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Version Control
                    <Dialog
                      open={showVersionDialog}
                      onOpenChange={setShowVersionDialog}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Icons.Plus />
                          <span className="ml-2">New Version</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Version</DialogTitle>
                          <DialogDescription>
                            Create a new version for this project
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="versionName">Version Name</Label>
                            <Input
                              id="versionName"
                              placeholder="e.g., V2, V3, Final"
                              value={newVersionName}
                              onChange={(e) =>
                                setNewVersionName(e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowVersionDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleCreateVersion}>
                            Create Version
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {versions.map((version) => (
                      <div key={version.id} className="flex items-center gap-2">
                        <Button
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
                            className={`w-2 h-2 rounded-full ${getVersionStatusColor(
                              version.status
                            )}`}
                          />
                          {version.version}
                          {/* <Badge variant="secondary" className="ml-1">
                            {getVersionStatusText(version.status)}
                          </Badge> */}
                        </Button>

                        {/* Version Actions */}
                        {version.status === "PENDING_REVIEW" && (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveVersion(version.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Icons.CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const feedback = prompt(
                                  "Please provide feedback for rejection:"
                                );
                                if (feedback) {
                                  handleRejectVersion(version.id, feedback);
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Icons.XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* File Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Files ({currentVersionData?.files.length || 0})
                    <div className="flex gap-2">
                      <Dialog
                        open={showFileDialog}
                        onOpenChange={setShowFileDialog}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Icons.Plus />
                            <span className="ml-2">Add Files</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload Files</DialogTitle>
                            <DialogDescription>
                              Upload design files for {currentVersion} review
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="fileUpload">Choose Files</Label>
                              <Input
                                id="fileUpload"
                                type="file"
                                multiple
                                accept="image/*,.pdf,.psd,.ai,.eps"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setNewFile(file);
                                }}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setShowFileDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() =>
                                newFile && handleFileUpload(newFile)
                              }
                              disabled={!newFile || isUploading}
                            >
                              {isUploading ? "Uploading..." : "Upload"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {currentVersionData?.files &&
                        currentVersionData.files.length > 0 && (
                          <Button
                            onClick={handlePublishVersion}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Icons.CheckCircle />
                            <span className="ml-2">Publish for Review</span>
                          </Button>
                        )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Upload and manage design files for client review. Supported
                    formats: JPG, PNG
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentVersionData && currentVersionData.files.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentVersionData.files.map((file) => (
                        <div
                          key={file.id}
                          className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {/* Image Thumbnail or File Icon */}
                          <div className="relative aspect-[4/3] bg-muted">
                            {isImageFile(file) ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  e.currentTarget.nextElementSibling?.classList.remove(
                                    "hidden"
                                  );
                                }}
                              />
                            ) : null}
                            <div
                              className={`absolute inset-0 flex items-center justify-center ${
                                isImageFile(file) ? "hidden" : ""
                              }`}
                            >
                              <div className="h-12 w-12 text-muted-foreground flex items-center justify-center">
                                <Icons.FolderOpen />
                              </div>
                            </div>

                            {/* Overlay with actions */}
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                              <div className="flex gap-2"></div>
                            </div>
                          </div>

                          {/* File Info */}
                          <div className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p
                                  className="font-medium text-sm truncate"
                                  title={file.name}
                                >
                                  {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)} •{" "}
                                  {new Date(
                                    file.uploadedAt
                                  ).toLocaleDateString()}
                                </p>
                                {annotations[file.id] &&
                                  annotations[file.id].length > 0 && (
                                    <div className="mt-2 flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3 text-blue-500" />
                                      <span className="text-xs text-blue-500">
                                        {annotations[file.id].length} annotation
                                        {annotations[file.id].length !== 1
                                          ? "s"
                                          : ""}
                                      </span>
                                    </div>
                                  )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFileRemove(file.id)}
                                className="text-destructive hover:text-destructive ml-2"
                              >
                                <div className="h-4 w-4 flex items-center justify-center">
                                  <Icons.Trash />
                                </div>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="h-12 w-12 mx-auto mb-4 opacity-50">
                        <Icons.FolderOpen />
                      </div>
                      <p>No files uploaded yet</p>
                      <p className="text-sm">
                        Click "Add Files" to upload design files for{" "}
                        {currentVersion}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Version Comparison */}
              {versions.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icons.Compare className="h-5 w-5" />
                      Version Comparison
                    </CardTitle>
                    <CardDescription>
                      Compare all versions side by side for client review
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {versions.map((version) => (
                        <div key={version.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{version.version}</h4>
                            <Badge className={getStatusColor(version.status)}>
                              {getVersionStatusText(version.status)}
                            </Badge>
                          </div>

                          {/* Version Files Preview */}
                          <div className="space-y-2">
                            {version.files.slice(0, 2).map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                {isImageFile(file) ? (
                                  <img
                                    src={file.url}
                                    alt={file.name}
                                    className="w-8 h-8 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                    <Icons.File className="h-4 w-4" />
                                  </div>
                                )}
                                <span className="truncate">{file.name}</span>
                              </div>
                            ))}
                            {version.files.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{version.files.length - 2} more files
                              </p>
                            )}
                          </div>

                          {/* Version Info */}
                          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                            <p>
                              Created:{" "}
                              {new Date(version.createdAt).toLocaleDateString()}
                            </p>
                            {version.approvedBy && (
                              <p className="text-green-600">
                                Approved by: {version.approvedBy}
                              </p>
                            )}
                            {version.rejectedBy && (
                              <p className="text-red-600">
                                Rejected by: {version.rejectedBy}
                              </p>
                            )}
                            {version.clientFeedback && (
                              <p className="text-orange-600">
                                Feedback: {version.clientFeedback}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Project Settings & Info */}
            <div className="space-y-6">
              {/* Project Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                  <CardDescription>
                    Project details and statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Project ID</Label>
                    <p className="text-sm text-muted-foreground">
                      {project.id}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Project Name</Label>
                    <p className="text-sm text-muted-foreground">
                      {project.name}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Client</Label>
                    <p className="text-sm text-muted-foreground">
                      {clientsLoading
                        ? "Loading..."
                        : (Array.isArray(clients)
                            ? (() => {
                                const client = clients.find((c) => c.id === project.clientId);
                                return client ? `${client.firstName} ${client.lastName}` : "Unknown Client";
                              })()
                            : "Unknown Client") || "Unknown Client"}
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
                    <Label className="text-sm font-medium">
                      Files in Current Version
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {currentVersionData?.files.length || 0} files
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Shareable Link */}  
              <Card>
                <CardHeader>
                  <CardTitle>Shareable Link</CardTitle>
                  <CardDescription>
                    Share this link with your client
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-mono break-all">
                      {project.publicLink}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(project.publicLink);
                          toast({
                            title: "Link Copied!",
                            description: "Public link has been copied to clipboard.",
                          });
                        } catch (error) {
                          toast({
                            title: "Copy Failed",
                            description: "Failed to copy link to clipboard.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Icons.Copy />
                      <span className="ml-2">Copy Link</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Workflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>1. Create new versions as needed</p>
                    <p>2. Upload files to each version</p>
                    <p>3. Publish version for client review</p>
                    <p>4. Share link with client</p>
                    <p>5. Client reviews and provides feedback</p>
                    <p>6. Make changes and create new versions</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Chat Messages */}
      {chatMessages.length > 0 && (
        <div className="fixed bottom-4 right-4 w-80 max-h-96 bg-card border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <h3 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Real-time Updates
            </h3>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            <div className="space-y-3">
              {chatMessages.slice(-10).map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg text-sm ${
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
                      className="text-xs"
                    >
                      {message.type === "status" ? "Status" : "Annotation"}
                    </Badge>
                    {message.senderName && (
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            message.isFromAdmin ? "bg-blue-500" : "bg-green-500"
                          }`}
                        ></div>
                        <span className="text-xs font-medium text-foreground">
                          {message.isFromAdmin ? "You" : message.senderName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {message.isFromAdmin ? "sent" : "received"}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(message.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Annotation Modal */}
      <Dialog open={showAnnotationModal} onOpenChange={setShowAnnotationModal}>
        <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Annotate Image
            </DialogTitle>
            <DialogDescription>
              Add annotations and feedback for {selectedImage?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedImage && (
            <div className="flex-1 flex flex-col space-y-4 min-h-0">
              {/* Image Display */}
              <div className="relative bg-muted rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              </div>

              {/* Annotations List with Scroll */}
              <div className="flex-1 flex flex-col space-y-3 min-h-0">
                <h4 className="font-medium flex-shrink-0">Annotations</h4>
                {annotations[selectedImage.id] &&
                annotations[selectedImage.id].length > 0 ? (
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {annotations[selectedImage.id].map((annotation, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-xs font-medium text-blue-600">
                              Admin User
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{annotation}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeAnnotation(selectedImage.id, index)
                          }
                          className="text-destructive hover:text-destructive flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      No annotations yet
                    </p>
                  </div>
                )}
              </div>

              {/* Add New Annotation - Fixed at bottom */}
              <div className="space-y-2 flex-shrink-0 border-t pt-4">
                <Label htmlFor="newAnnotation">Add Annotation</Label>
                <div className="flex gap-2">
                  <Input
                    id="newAnnotation"
                    placeholder="Enter your annotation or feedback..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        addAnnotation(
                          selectedImage.id,
                          e.currentTarget.value.trim()
                        );
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.currentTarget
                        .previousElementSibling as HTMLInputElement;
                      if (input.value.trim()) {
                        addAnnotation(selectedImage.id, input.value.trim());
                        input.value = "";
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAnnotationModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog
        open={showViewDetailsModal}
        onOpenChange={setShowViewDetailsModal}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              File Details & Annotations
            </DialogTitle>
            <DialogDescription>
              View file details and annotations for{" "}
              {selectedFileForDetails?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedFileForDetails && (
            <div className="space-y-4">
              {/* File Preview */}
              <div className="relative bg-muted rounded-lg overflow-hidden">
                {isImageFile(selectedFileForDetails) ? (
                  <img
                    src={selectedFileForDetails.url}
                    alt={selectedFileForDetails.name}
                    className="w-full h-auto max-h-[300px] object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <div className="h-16 w-16 text-muted-foreground flex items-center justify-center">
                      <Icons.FolderOpen />
                    </div>
                  </div>
                )}
              </div>

              {/* File Information */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm font-medium">File Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedFileForDetails.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">File Size</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFileForDetails.size)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Upload Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(
                      selectedFileForDetails.uploadedAt
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">File Type</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedFileForDetails.type}
                  </p>
                </div>
              </div>

              {/* Annotations List */}
              <div className="space-y-3">
                <h4 className="font-medium">Annotations & Feedback</h4>
                {annotations[selectedFileForDetails.id] &&
                annotations[selectedFileForDetails.id].length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {annotations[selectedFileForDetails.id].map(
                      (annotation, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 bg-muted rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-sm">{annotation}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Added {new Date().toLocaleDateString()}
                            </p>
                          </div>
                          {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAnnotation(selectedFileForDetails.id, index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button> */}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No annotations yet</p>
                    <p className="text-sm">
                      Add annotations using the "Annotate" button
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowViewDetailsModal(false)}
            >
              Close
            </Button>
            {selectedFileForDetails && isImageFile(selectedFileForDetails) && (
              <Button
                onClick={() => {
                  setShowViewDetailsModal(false);
                  openAnnotationModal(selectedFileForDetails);
                }}
              >
                <PenTool className="h-4 w-4 mr-2" />
                Add Annotation
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
