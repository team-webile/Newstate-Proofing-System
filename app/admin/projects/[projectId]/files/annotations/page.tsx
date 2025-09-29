"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoutButton } from "@/components/logout-button"
import { Eye, MessageSquare, PenTool, ArrowLeft, Plus, X, MapPin, CheckCircle, AlertCircle, Download, Upload, FileText, MessageCircle } from "lucide-react"
import { useUnifiedSocket } from '@/hooks/use-unified-socket'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"

interface ProjectFile {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
  version: string
  fullUrl?: string
}

interface Version {
  id: string
  version: string
  files: ProjectFile[]
  status: "draft" | "pending_review" | "approved" | "rejected" | "in_revision"
  createdAt: string
  annotations: Annotation[]
  revisionNotes?: string
}

interface Project {
  id: string
  name: string
  clientId: string
  description: string
  allowDownloads: boolean
  emailNotifications: boolean
  publicLink: string
  status: "draft" | "pending" | "approved" | "revisions" | "active" | "archived" | "completed" | "rejected"
  createdAt: string
  lastActivity: string
}

interface Client {
  id: string
  name: string
  company?: string
}

interface AnnotationReply {
  id: string
  content: string
  addedBy: string
  addedByName: string
  createdAt: string
}

interface Annotation {
  id: string
  content: string
  fileId: string
  addedBy: string
  addedByName: string
  createdAt: string
  x?: number
  y?: number
  status: 'PENDING' | 'COMPLETED' | "rejected"
  assignedTo?: string
  fileVersion?: string
  isResolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  replies?: AnnotationReply[]
}

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'USER'
}

interface ProjectAnnotationsPageProps {
  params: {
    projectId: string
  }
}

export default function ProjectAnnotationsPage({ params }: ProjectAnnotationsPageProps) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)
  const [newAnnotation, setNewAnnotation] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showAnnotationInput, setShowAnnotationInput] = useState(false)
  const [annotationPosition, setAnnotationPosition] = useState<{x: number, y: number} | null>(null)
  const [selectedAnnotationForReply, setSelectedAnnotationForReply] = useState<Annotation | null>(null)
  const [newReply, setNewReply] = useState('')
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null)
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false)
  const [showAnnotationPopup, setShowAnnotationPopup] = useState(false)
  const [popupPosition, setPopupPosition] = useState<{x: number, y: number} | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@newstatebranding.com',
    role: 'ADMIN'
  })
  const [notifications, setNotifications] = useState<any[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [clientsError, setClientsError] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{id: string, type: 'annotation' | 'status', message: string, timestamp: string, addedBy?: string, senderName?: string, isFromAdmin?: boolean}>>([])
  const [versions, setVersions] = useState<Version[]>([])
  const [currentVersion, setCurrentVersion] = useState<string>("V1")
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [newVersionName, setNewVersionName] = useState("")
  const [newVersionDescription, setNewVersionDescription] = useState("")
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
  const [approvalComment, setApprovalComment] = useState("")
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<'zip' | 'individual'>('zip')
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [showAnnotationChat, setShowAnnotationChat] = useState(false)
  const [selectedAnnotationChat, setSelectedAnnotationChat] = useState<Annotation | null>(null)
  const [replyText, setReplyText] = useState("")
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  // Update selectedAnnotationChat when annotations are updated
  useEffect(() => {
    if (selectedAnnotationChat && annotations.length > 0) {
      const updatedAnnotation = annotations.find(a => a.id === selectedAnnotationChat.id);
      if (updatedAnnotation && updatedAnnotation.replies) {
        console.log('🔄 Updating selectedAnnotationChat with new replies:', updatedAnnotation.replies);
        setSelectedAnnotationChat(prev => ({
          ...prev!,
          replies: updatedAnnotation.replies || []
        }));
      }
    }
  }, [annotations]);

  // Fetch clients data
  const fetchClients = async () => {
    try {
      setClientsLoading(true)
      const response = await fetch('/api/clients')
      const data = await response.json()
      
      if (data.status === 'success') {
        console.log('Clients data:', data.data)
        setClients(Array.isArray(data.data) ? data.data : [])
      } else {
        setClientsError(data.message || 'Failed to fetch clients')
        setClients([])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClientsError('Failed to fetch clients')
      setClients([])
    } finally {
      setClientsLoading(false)
    }
  }

  // Fetch project data
  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.projectId}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        const projectInfo = data.data
        const projectWithLink = {
          id: projectInfo.id,
          name: projectInfo.title,
          clientId: projectInfo.clientId,
          description: projectInfo.description || '',
          allowDownloads: projectInfo.downloadEnabled,
          emailNotifications: projectInfo.emailNotifications ?? true,
          publicLink: `${window.location.origin}/client/${projectInfo.clientId}?project=${projectInfo.id}`,
          status: projectInfo.status.toLowerCase(),
          createdAt: projectInfo.createdAt,
          lastActivity: projectInfo.lastActivity ? new Date(projectInfo.lastActivity).toLocaleDateString() : "Unknown",
        }
        setProject(projectWithLink)
      } else {
        console.error('Failed to fetch project:', data.message)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    }
  }

  // Fetch versions from database
  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/projects/${params.projectId}/versions`)
      const data = await response.json()
      
      if (data.status === 'success' && data.data && data.data.length > 0) {
        const versionsFromDb = data.data.map((version: any) => ({
          id: version.id,
          version: version.version,
          files: [],
          status: version.status || 'draft',
          createdAt: version.createdAt,
          annotations: []
        }))
        setVersions(versionsFromDb)
      } else {
        // If no versions from database, initialize with default V1
        setVersions([
          {
            id: "1",
            version: "V1",
            files: [],
            status: "draft",
            createdAt: new Date().toISOString(),
            annotations: []
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
      // Fallback to default V1 if error
      setVersions([
        {
          id: "1",
          version: "V1",
          files: [],
          status: "draft",
          createdAt: new Date().toISOString(),
          annotations: []
        }
      ])
    }
  }

  // Fetch project files
  const fetchProjectFiles = async () => {
    try {
      const response = await fetch(`/api/projects/${params.projectId}/files`)
      const data = await response.json()
      
      if (data.status === 'success') {
        console.log('Project files:', data.data)
        
        if (data.data.files && Array.isArray(data.data.files)) {
          const files = data.data.files.map((file: any) => ({
            id: file.id || Date.now().toString(),
            name: file.name,
            url: file.url,
            type: file.type,
            size: file.size,
            uploadedAt: file.uploadedAt,
            version: file.version || 'V1'
          }))
          
          // Group files by version
          const filesByVersion: { [key: string]: ProjectFile[] } = {}
          files.forEach((file: ProjectFile) => {
            if (!filesByVersion[file.version]) {
              filesByVersion[file.version] = []
            }
            filesByVersion[file.version].push(file)
          })
          
          // Update versions with their respective files
          setVersions(prev => prev.map(v => ({
            ...v,
            files: filesByVersion[v.version] || []
          })))
          
          setFiles(files)
        }
      }
    } catch (error) {
      console.error('Error fetching project files:', error)
    }
  }

  // Fetch annotations from database
  const fetchAnnotations = async () => {
    try {
      const response = await fetch(`/api/annotations?projectId=${params.projectId}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        // Transform the data to match our interface
        const transformedAnnotations = data.data.map((annotation: any) => ({
          id: annotation.id,
          content: annotation.content,
          fileId: annotation.fileId,
          addedBy: annotation.addedBy,
          addedByName: annotation.addedByName,
          createdAt: annotation.createdAt,
          x: annotation.x || (annotation.coordinates ? JSON.parse(annotation.coordinates).x : undefined),
          y: annotation.y || (annotation.coordinates ? JSON.parse(annotation.coordinates).y : undefined),
          status: annotation.status || 'PENDING',
          isResolved: annotation.isResolved || false,
          replies: annotation.replies || []
        }))
        setAnnotations(transformedAnnotations)
      }
    } catch (error) {
      console.error('Error fetching annotations:', error)
    }
  }


  // Handle version change
  const handleVersionChange = (version: string) => {
    setCurrentVersion(version)
  }



  // Get current version data
  const currentVersionData = versions.find(v => v.version === currentVersion)

  // Helper functions
  const isImageFile = (file: ProjectFile) => {
    return file.type.startsWith('image/')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getVersionStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      case "pending_review":
        return "bg-blue-500"
      case "draft":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getVersionStatusText = (status: string) => {
    switch (status) {
      case "approved": return "Approved"
      case "rejected": return "rejected"
      case "pending_review": return "Pending Review"
      case "draft": return "Draft"
      default: return "Unknown"
    }
  }

  // Approve or reject project
  const handleApproval = async () => {
    try {
      const response = await fetch(`/api/projects/${params.projectId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: approvalAction,
          comment: approvalComment,
          approvedBy: currentUser?.id,
          approvedByName: currentUser?.name
        })
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        setShowApprovalDialog(false)
        setApprovalComment("")
        fetchProject()
      }
    } catch (error) {
      console.error('Error processing approval:', error)
    }
  }

  // Download files
  const handleDownload = async (format: 'zip' | 'individual', versionId?: string) => {
    try {
      let url = `/api/projects/${params.projectId}/download?format=${format}`
      if (versionId) {
        url += `&version=${versionId}`
      }

      const response = await fetch(url)
      const blob = await response.blob()
      
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${project?.name || 'project'}-${format === 'zip' ? 'files.zip' : 'file'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error downloading files:', error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchProject(),
        fetchClients(),
        fetchVersions(),
        fetchAnnotations()
      ])
      
      // Fetch files after versions are loaded to properly associate them
      await fetchProjectFiles()
      setIsLoading(false)
    }
    
    fetchData()
  }, [params.projectId])

  // Initialize unified socket
  const {
    isConnected,
    emitAnnotation,
    emitAnnotationReply,
    emitAnnotationStatusChange,
    emitProjectStatusChange
  } = useUnifiedSocket({
    projectId: params.projectId,
    events: {
      onAnnotationAdded: (data) => {
        console.log('🔔 Admin received annotationAdded event:', data)
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          content: data.annotation || data.content,
          fileId: data.fileId,
          addedBy: data.addedBy || 'Unknown',
          addedByName: data.addedByName || 'Unknown',
          createdAt: data.timestamp,
          status: 'PENDING',
          isResolved: false,
          x: data.x,
          y: data.y
        }
        
        setAnnotations(prev => [...prev, newAnnotation])
        setLastUpdate(data.timestamp)
        
        // Add to chat messages
        const senderName = data.addedByName || data.addedBy || 'Unknown'
        const isFromAdmin = senderName.includes('Admin') || senderName === 'Admin User'
        const messageText = isFromAdmin 
          ? `You sent: "${data.annotation || data.content}"`
          : `Received from ${senderName}: "${data.annotation || data.content}"`
        
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'annotation',
          message: messageText,
          timestamp: data.timestamp,
          addedBy: senderName,
          senderName: senderName,
          isFromAdmin: isFromAdmin
        }])
        
        // Show visual notification for new annotation from client
        if (!isFromAdmin) {
          const notification = {
            id: Date.now().toString(),
            type: 'annotation',
            title: 'New Annotation Added',
            message: `${senderName} added a new annotation: "${data.annotation || data.content}"`,
            timestamp: data.timestamp,
            fileId: data.fileId,
            x: data.x,
            y: data.y
          }
          setNotifications(prev => [notification, ...prev.slice(0, 9)])
        }
      },
      onAnnotationReplyAdded: (data) => {
        console.log('🔔 Admin received annotation reply via socket:', data)
        
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
        
        setAnnotations(prev => prev.map(annotation => 
          annotation.id === data.annotationId 
            ? { 
                ...annotation, 
                replies: [...(annotation.replies || []), newReply]
              }
            : annotation
        ))
        
        // Update selectedAnnotationChat if it's the same annotation
        if (selectedAnnotationChat && selectedAnnotationChat.id === data.annotationId) {
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
        } else {
          const isFromClient = newReply.addedBy === 'Client' || newReply.addedByName === 'Client';
          if (isFromClient) {
            const notification = {
              id: Date.now().toString(),
              type: 'reply',
              title: 'New Reply Received',
              message: `${newReply.addedByName} replied: "${newReply.content}"`,
              timestamp: newReply.createdAt,
              annotationId: data.annotationId
            };
            setNotifications(prev => [notification, ...prev.slice(0, 9)]);
          }
        }
        
        // Add to chat messages
        const senderName = newReply.addedByName || newReply.addedBy || 'Unknown'
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'annotation',
          message: `Reply added by ${senderName}: ${newReply.content}`,
          timestamp: data.timestamp || newReply.createdAt,
          addedBy: newReply.addedBy,
          senderName: senderName,
          isFromAdmin: newReply.addedBy === 'admin-1'
        }])
        setLastUpdate(data.timestamp)
      },
      onAnnotationStatusUpdated: (data) => {
        setAnnotations(prev => prev.map(annotation => 
          annotation.id === data.annotationId 
            ? { 
                ...annotation, 
                status: data.status as any,
                isResolved: data.status === 'COMPLETED'
              }
            : annotation
        ))
        
        const senderName = data.updatedByName || data.updatedBy || 'Unknown'
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'status',
          message: `Annotation status changed to ${data.status} by ${senderName}`,
          timestamp: data.timestamp,
          addedBy: data.updatedBy,
          senderName: senderName,
          isFromAdmin: data.updatedBy === 'admin-1'
        }])
        setLastUpdate(data.timestamp)
      },
      onProjectStatusChanged: (data) => {
        setProject(prev => prev ? { ...prev, status: data.status as any } : prev)
        
        const senderName = data.changedByName || data.changedBy || 'Unknown'
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'status',
          message: `Project status changed to ${data.status} by ${senderName}`,
          timestamp: data.timestamp,
          addedBy: data.changedBy,
          senderName: senderName,
          isFromAdmin: data.changedBy === 'admin-1'
        }])
        setLastUpdate(data.timestamp)
      }
    }
  })

  const addAnnotation = async () => {
    if (!newAnnotation.trim() || !selectedFile) return
    
    try {
      const currentUser = {
        name: 'Admin User',
        role: 'Admin'
      }
      
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newAnnotation,
          fileId: selectedFile.id,
          projectId: params.projectId,
          addedBy: currentUser.role,
          addedByName: currentUser.name,
          coordinates: popupPosition
        })
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        const newAnnotationObj: Annotation = {
          id: data.data.id,
          content: newAnnotation,
          fileId: selectedFile.id,
          addedBy: currentUser.role,
          addedByName: currentUser.name,
          createdAt: new Date().toISOString(),
          x: popupPosition?.x,
          y: popupPosition?.y,
          status: 'PENDING',
          isResolved: false,
          replies: []
        }
        
        // Add to annotations immediately
        setAnnotations(prev => [...prev, newAnnotationObj])
        
        // Add to chat messages for real-time updates
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'annotation',
          message: `You added annotation: "${newAnnotation}"`,
          timestamp: new Date().toISOString(),
          addedBy: currentUser.role,
          senderName: currentUser.name,
          isFromAdmin: true
        }])
        
        // Emit to Socket.io for real-time updates
        emitAnnotation({
          projectId: params.projectId,
          fileId: selectedFile.id,
          annotation: newAnnotation,
          addedBy: currentUser.role,
          addedByName: currentUser.name,
          x: popupPosition?.x,
          y: popupPosition?.y,
          timestamp: new Date().toISOString()
        })
        
        setNewAnnotation("")
        setShowAnnotationPopup(false)
        setPopupPosition(null)
      } else {
        console.error('Failed to save annotation:', data.message)
        alert('Failed to save annotation. Please try again.')
      }
    } catch (error) {
      console.error('Error saving annotation:', error)
      alert('Failed to save annotation. Please try again.')
    }
  }

  const removeAnnotation = async (annotationId: string) => {
    try {
      const response = await fetch(`/api/annotations/${annotationId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        setAnnotations(prev => prev.filter(ann => ann.id !== annotationId))
      } else {
        alert('Failed to delete annotation. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting annotation:', error)
      alert('Failed to delete annotation. Please try again.')
    }
  }


  const getFileAnnotations = (fileId: string) => {
    return annotations.filter(ann => ann.fileId === fileId)
  }

  // Check if all annotations are completed or rejected
  const areAllAnnotationsResolved = () => {
    if (!selectedFile) return false;
    const fileAnnotations = getFileAnnotations(selectedFile.id);
    return fileAnnotations.every(annotation => 
      annotation.status === 'COMPLETED' || annotation.status === "rejected"
    );
  };

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!isImageFile(selectedFile!)) return
    
    // Don't allow adding annotations if project status is completed or rejected
    if (project?.status === 'completed' || (project?.status as string) === "rejected") {
      return;
    }
    
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    
    // Check if clicking on a resolved annotation
    const clickedAnnotation = getFileAnnotations(selectedFile!.id).find(annotation => {
      if (annotation.x !== undefined && annotation.y !== undefined) {
        const distance = Math.sqrt(
          Math.pow(annotation.x - x, 2) + Math.pow(annotation.y - y, 2)
        )
        return distance < 5 // Within 5% of the annotation position
      }
      return false
    })
    
    // If clicking on a resolved annotation, don't show input
    if (clickedAnnotation && clickedAnnotation.isResolved) {
      return
    }
    
    // Show annotation popup
    setNewAnnotation("")
    setPopupPosition({ x, y })
    setShowAnnotationPopup(true)
  }

  const handleCancelAnnotation = () => {
    setShowAnnotationPopup(false)
    setPopupPosition(null)
    setNewAnnotation("")
  }

  const addReply = async (annotationId: string) => {
    if (!newReply.trim()) return
    
    try {
      const response = await fetch('/api/annotations/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotationId,
          content: newReply,
          addedBy: 'Admin',
          addedByName: 'Admin User'
        })
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        // Update local state
        setAnnotations(prev => prev.map(annotation => 
          annotation.id === annotationId 
            ? { 
                ...annotation, 
                replies: [...(annotation.replies || []), {
                  id: data.data.id,
                  content: newReply,
                  addedBy: 'Admin',
                  addedByName: 'Admin User',
                  createdAt: new Date().toISOString()
                }]
              }
            : annotation
        ))
        
        // Add to chat messages for real-time updates
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'annotation',
          message: `You replied: "${newReply}"`,
          timestamp: new Date().toISOString(),
          addedBy: 'Admin',
          senderName: 'Admin User',
          isFromAdmin: true
        }])
        
        // Emit to socket
        emitAnnotationReply({
          projectId: params.projectId,
          annotationId,
          reply: newReply,
          addedBy: 'Admin',
          addedByName: 'Admin User',
          timestamp: new Date().toISOString()
        })
        
        setNewReply('')
        setShowReplyInput(false)
        setSelectedAnnotationForReply(null)
      } else {
        console.error('Failed to save reply:', data.message)
        alert('Failed to save reply. Please try again.')
      }
    } catch (error) {
      console.error('Error saving reply:', error)
      alert('Failed to save reply. Please try again.')
    }
  }

  const handleReplyClick = (annotation: Annotation) => {
    setSelectedAnnotationForReply(annotation)
    setShowReplyInput(true)
  }

  const handleCancelReply = () => {
    setShowReplyInput(false)
    setSelectedAnnotationForReply(null)
    setNewReply('')
  }

  // Enhanced annotation functions
  const updateAnnotationStatus = async (annotationId: string, status: string) => {
    try {
      const response = await fetch('/api/annotations/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotationId,
          status,
          updatedBy: currentUser?.name || 'Admin'
        })
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        // Update local state immediately
        setAnnotations(prev => prev.map(annotation => 
          annotation.id === annotationId 
            ? { 
                ...annotation, 
                status: status as any, 
                isResolved: status === 'COMPLETED',
                resolvedBy: status === 'COMPLETED' ? currentUser?.name || 'Admin' : annotation.resolvedBy,
                resolvedAt: status === 'COMPLETED' ? new Date().toISOString() : annotation.resolvedAt
              }
            : annotation
        ))
        
        // Add to chat messages for real-time updates
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'status',
          message: `You changed annotation status to ${status}`,
          timestamp: new Date().toISOString(),
          addedBy: currentUser?.name || 'Admin',
          senderName: currentUser?.name || 'Admin',
          isFromAdmin: true
        }])
        
        // Emit status change to socket
        emitAnnotationStatusChange({
          projectId: params.projectId,
          annotationId,
          status,
          updatedBy: currentUser?.name || 'Admin',
          updatedByName: currentUser?.name || 'Admin'
        })
      } else {
        console.error('Failed to update annotation status:', data.message)
        alert('Failed to update annotation status. Please try again.')
      }
    } catch (error) {
      console.error('Error updating annotation status:', error)
      alert('Failed to update annotation status. Please try again.')
    }
  }

  const assignAnnotation = async (annotationId: string, userId: string) => {
    try {
      const response = await fetch('/api/annotations/assign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotationId,
          assignedTo: userId,
          assignedBy: currentUser?.name || 'Admin'
        })
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        setAnnotations(prev => prev.map(annotation => 
          annotation.id === annotationId 
            ? { ...annotation, assignedTo: userId }
            : annotation
        ))
        
        // Emit assignment
        if (socket) {
          socket.emit('annotationAssigned', {
            projectId: params.projectId,
            annotationId,
            assignedTo: userId,
            assignedBy: currentUser?.name || 'Admin'
          })
        }
      }
    } catch (error) {
      console.error('Error assigning annotation:', error)
    }
  }

  const handleAnnotationClick = (annotation: Annotation) => {
    setSelectedAnnotation(annotation)
    setShowAnnotationPanel(true)
  }

  // Handle annotation chat click
  const handleAnnotationChatClick = (annotation: Annotation) => {
    console.log('🔍 Opening annotation chat with data:', annotation);
    setSelectedAnnotationChat(annotation);
    setShowAnnotationChat(true);
    
    // Auto-scroll to bottom when opening chat
    setTimeout(() => {
      scrollToBottom();
    }, 200);
  }

  // Handle close annotation chat
  const handleCloseAnnotationChat = () => {
    setShowAnnotationChat(false);
    setSelectedAnnotationChat(null);
  }

  // Handle reply submit for chat
  const handleReplySubmit = async () => {
    if (!replyText.trim() || !selectedAnnotationChat) return;

    try {
      const response = await fetch('/api/annotations/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotationId: selectedAnnotationChat.id,
          content: replyText,
          addedBy: 'Admin',
          addedByName: 'Admin User'
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Update local state
        setAnnotations(prev => prev.map(annotation => 
          annotation.id === selectedAnnotationChat.id 
            ? { 
                ...annotation, 
                replies: [...(annotation.replies || []), {
                  id: data.data.id,
                  content: replyText,
                  addedBy: 'Admin',
                  addedByName: 'Admin User',
                  createdAt: new Date().toISOString()
                }]
              }
            : annotation
        ));

        // Update selectedAnnotationChat
        setSelectedAnnotationChat(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            replies: [...(prev.replies || []), {
              id: data.data.id,
              content: replyText,
              addedBy: 'Admin',
              addedByName: 'Admin User',
              createdAt: new Date().toISOString()
            }]
          };
        });

        // Add to chat messages
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'annotation',
          message: `You replied: "${replyText}"`,
          timestamp: new Date().toISOString(),
          addedBy: 'Admin',
          senderName: 'Admin User',
          isFromAdmin: true
        }]);

        // Emit to socket
        emitAnnotationReply({
          projectId: params.projectId,
          annotationId: selectedAnnotationChat.id,
          reply: replyText,
          addedBy: 'Admin',
          addedByName: 'Admin User',
          timestamp: new Date().toISOString()
        });

        setReplyText('');
        
        // Auto-scroll to bottom after sending reply
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        console.error('Failed to save reply:', data.message);
        alert('Failed to save reply. Please try again.');
      }
    } catch (error) {
      console.error('Error saving reply:', error);
      alert('Failed to save reply. Please try again.');
    }
  };

  const getAnnotationStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-500'
      case 'IN_PROGRESS': return 'bg-yellow-500'
      case 'RESOLVED': return 'bg-green-500'
      case 'CLOSED': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }

  const canEditAnnotation = (annotation: Annotation) => {
    if (!currentUser) return false
    return currentUser.role === 'ADMIN' || annotation.addedBy === currentUser.id
  }

  const canResolveAnnotation = (annotation: Annotation) => {
    if (!currentUser) return false
    return currentUser.role === 'ADMIN' || annotation.addedBy === currentUser.id
  }

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "approved":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "revisions":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "draft":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading annotations...</p>
        </div>
      </div>
    )
  }
  
  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 text-muted-foreground mx-auto mb-4"><Icons.FolderOpen /></div>
          <h3 className="text-lg font-medium mb-2">Project not found</h3>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/admin/projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }
    console.log(project,'annotations')
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/projects/${params.projectId}/files`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="ml-2">Back to Files</span>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Project Annotations</h1>
              <p className="text-sm text-muted-foreground">
                Manage annotations and feedback for {project.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDownloadDialog(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {project.status !== 'completed' && project.status !== "rejected" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApprovalDialog(true)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve/Reject
            </Button>
            )}
          <Badge variant="outline">
            Admin Access
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
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
          {notifications.slice(0, 3).map((notification) => (
            <div
              key={notification.id}
              className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg shadow-lg p-4 animate-in slide-in-from-right duration-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
              onClick={() => {
                if (notification.annotationId) {
                  // Find the annotation and open chat
                  const annotation = annotations.find(a => a.id === notification.annotationId);
                  if (annotation) {
                    console.log('🔍 Opening chat for annotation:', annotation);
                    console.log('🔍 Annotation replies:', annotation.replies);
                    handleAnnotationChatClick(annotation);
                  }
                }
                // Remove notification after clicking
                setNotifications(prev => prev.filter(n => n.id !== notification.id));
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
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
                  {notification.x !== undefined && notification.y !== undefined && (
                    <p className="text-xs text-gray-500">
                      Position: {notification.x.toFixed(1)}%, {notification.y.toFixed(1)}%
                    </p>
                  )}
                  {notification.annotationId && (
                    <p className="text-xs text-gray-500">
                      Click to view conversation
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
                    setNotifications(prev => prev.filter(n => n.id !== notification.id))
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
            {/* Main Content Section */}
            <div className="lg:col-span-2">
              {/* Version Control Section */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.GitBranch />
                    Version Control
                  </CardTitle>
                  <CardDescription>
                    Manage project versions and view files by version
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Current Version:</Label>
                      <div className="flex gap-2">
                        {versions.map((version) => (
                          <Button
                            key={version.id}
                            variant={currentVersion === version.version ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleVersionChange(version.version)}
                            className="flex items-center gap-2"
                          >
                            <div className={`w-2 h-2 rounded-full ${getVersionStatusColor(version.status)}`} />
                            {version.version}
                            
                          </Button>
                        ))}
                      </div>
                    </div>
                   
                  </div>

                  {/* Version Files */}
                  {currentVersionData && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Files in {currentVersion} ({currentVersionData.files.length} files)
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentVersionData.files.map((file) => (
                          <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                              {isImageFile(file) ? (
                                <Icons.Image />
                              ) : (
                                <Icons.File />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant={selectedFile?.id === file.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedFile(file)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {selectedFile?.id === file.id ? 'Selected' : 'Select'}
                            </Button>
                          </div>
                        ))}
                        {currentVersionData.files.length === 0 && (
                          <div className="col-span-2 text-center py-8 text-muted-foreground">
                            <Icons.File />
                            <p>No files in this version</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* File Preview Section */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.Eye />
                    File Preview
                  </CardTitle>
                  <CardDescription>
                    {selectedFile ? (
                      project?.status === 'completed' ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          This project has been completed. No further annotations can be added.
                        </div>
                      ) : (project?.status as string) === "rejected" ? (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <AlertCircle className="h-4 w-4" />
                          This project has been rejected. No further annotations can be added.
                        </div>
                      ) : (
                        "Click anywhere on the design to add annotations and feedback"
                      )
                    ) : (
                      'Select a file to preview'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedFile && isImageFile(selectedFile) ? (
                      <div className="relative bg-muted rounded-lg overflow-hidden">
                            <img
                              src={selectedFile.url}
                              alt={selectedFile.name}
                        className={`w-full h-auto max-h-[500px] object-contain ${(project?.status === 'completed' || (project?.status as string) === "rejected") ? 'cursor-not-allowed' : 'cursor-crosshair'
                          }`}
                        onClick={(e) => {
                          if (project?.status === 'completed' || (project?.status as string) === "rejected") {
                            e.preventDefault();
                            return;
                          }
                          handleImageClick(e);
                        }}
                            />
                            
                            {/* Render existing annotations on image */}
                            {getFileAnnotations(selectedFile.id).map((annotation) => {
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
                                  } text-white text-xs px-3 py-2 rounded-full shadow-lg cursor-pointer hover:opacity-90 transition-all duration-300 group ${
                                    isOriginalMessage ? 'animate-pulse ring-2 ring-white ring-opacity-50' : ''
                                  }`}
                                onClick={() => handleAnnotationChatClick(annotation)}
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
                                    
                                    {/* Action buttons on hover */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-1">
                                {/* Show message if project is completed or rejected */}
                                {(project?.status === 'completed' || (project?.status as string) === "rejected") ? (
                                  <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-3 py-2 rounded-lg border">
                                    {project?.status === 'completed' ? 'Project Completed - No further actions' : 'Project Rejected - No further actions'}
                                  </div>
                                ) : (
                                  <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs bg-white border-blue-500 text-blue-500 hover:bg-blue-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReplyClick(annotation);
                                      }}
                                      >
                                        <MessageSquare className="h-3 w-3 mr-1" />
                                        Reply
                                      </Button>
                                      
                                      {/* Status control buttons */}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs bg-white border-green-500 text-green-500 hover:bg-green-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateAnnotationStatus(annotation.id, 'COMPLETED');
                                      }}
                                        >
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Resolve
                                        </Button>
                                  </>
                                      )}
                                    </div>
                                  </div>
                          );
                        }
                        return null;
                      })}

                      {/* Click to annotate badge */}
                      {project?.status !== 'completed' && (project?.status as string) !== "rejected" && (
                        <div className="absolute top-4 left-4">
                          <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                              <MapPin className="h-3 w-3 mr-1" />
                              Click to annotate
                            </Badge>
                                  </div>
                      )}
                      
                      {/* Status message badge */}
                      {(project?.status === 'completed' || (project?.status as string) === "rejected") && (
                        <div className="absolute top-4 left-4">
                          <Badge variant="outline" className={`text-xs ${project?.status === 'completed' ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                              {project?.status === 'completed' ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Project Completed
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Project Rejected
                                </>
                              )}
                            </Badge>
                                  </div>
                      )}

                      {/* Annotation counter badge */}
                      {getFileAnnotations(selectedFile.id).length > 0 && (
                          <div className="absolute top-4 right-4">
                            <Badge
                              variant="default"
                              className="text-xs bg-blue-500 text-white"
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {getFileAnnotations(selectedFile.id).length}{" "}
                              annotation
                              {getFileAnnotations(selectedFile.id).length !== 1 ? "s" : ""}
                            </Badge>
                              </div>
                            )}
                          </div>
                  ) : selectedFile ? (
                    <div className="relative bg-muted rounded-lg overflow-hidden border-2 border-border">
                      <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                              <Icons.FolderOpen />
                          <p className="text-lg font-medium">
                            {selectedFile.name}
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
              {selectedFile && getFileAnnotations(selectedFile.id).length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Comments & Annotations (
                      {getFileAnnotations(selectedFile.id).length}
                      )
                    </CardTitle>
                    <CardDescription>
                      All feedback and annotations for this file
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Annotations */}
                      {getFileAnnotations(selectedFile.id).map((annotation) => (
                        <div key={annotation.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-medium">
                                  {annotation.addedByName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {annotation.createdAt
                                    ? new Date(annotation.createdAt).toLocaleString()
                                    : 'Invalid Date'}
                            </span>
                            {annotation.x !== undefined && annotation.y !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                {annotation.x.toFixed(0)}%, {annotation.y.toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                              <p className="text-sm">{annotation.content}</p>
                              {annotation.x !== undefined && annotation.y !== undefined && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Position: {annotation.x.toFixed(1)}%, {annotation.y.toFixed(1)}%
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Show replies */}
                          {annotation.replies && annotation.replies.length > 0 && (
                            <div className="mt-3 ml-4 space-y-2">
                              {annotation.replies.map((reply) => (
                                <div key={reply.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium">{reply.addedByName}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(reply.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm">{reply.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Project Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Project Name</Label>
                    <p className="text-sm text-muted-foreground">{project.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Client</Label>
                    <p className="text-sm text-muted-foreground">N/A</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge
                      variant={
                        project.status === "completed" 
                          ? "default" 
                          : project.status === "active"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Files</Label>
                    <p className="text-sm text-muted-foreground">{files.length}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Annotations</Label>
                    <p className="text-sm text-muted-foreground">{annotations.length}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Files List */}
              {/* <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.FolderOpen />
                    Project Files
                  </CardTitle>
                  <CardDescription>
                    Select a file to view annotations and details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {files.length > 0 ? (
                    <div className="space-y-2">
                      {files.map((file) => {
                        const fileAnnotations = getFileAnnotations(file.id)
                        return (
                          <div
                            key={file.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedFile?.id === file.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedFile(file)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                                </p>
                                {fileAnnotations.length > 0 && (
                                  <div className="mt-1 flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3 text-blue-500" />
                                    <span className="text-xs text-blue-500">
                                      {fileAnnotations.length} annotation{fileAnnotations.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                 
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="h-12 w-12 mx-auto mb-4 opacity-50"><Icons.FolderOpen /></div>
                      <p>No files uploaded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card> */}
            </div>
  
            {/* File Details & Annotations */}
           
          </div>
        </div>
      </main>
      {/* Version Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Upload a new version of the project files.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="versionName">Version Name</Label>
              <Input
                id="versionName"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="e.g., V2 - Updated Design"
              />
            </div>
            <div>
              <Label htmlFor="versionDescription">Description</Label>
              <Textarea
                id="versionDescription"
                value={newVersionDescription}
                onChange={(e) => setNewVersionDescription(e.target.value)}
                placeholder="Describe the changes in this version..."
              />
            </div>
            <div>
              <Label htmlFor="file">Upload File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // File selected for upload
                    console.log('File selected:', file.name)
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersionDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve or Reject Project</DialogTitle>
            <DialogDescription>
              Make a decision on this project and add any comments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <Select value={approvalAction} onValueChange={(value: 'approve' | 'reject') => setApprovalAction(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="approvalComment">Comment (Optional)</Label>
              <Textarea
                id="approvalComment"
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Add any comments about your decision..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproval}>
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Files</DialogTitle>
            <DialogDescription>
              Choose how you want to download the project files.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Download Format</Label>
              <Select value={downloadFormat} onValueChange={(value: 'zip' | 'individual') => setDownloadFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zip">ZIP Archive (All Files)</SelectItem>
                  <SelectItem value="individual">Individual Files</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {versions.length > 0 && (
              <div>
                <Label>Version (Optional)</Label>
                <Select onValueChange={(value) => handleDownload(downloadFormat, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        {version.version} - {version.createdAt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDownloadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleDownload(downloadFormat)}>
              Download {downloadFormat === 'zip' ? 'ZIP' : 'Files'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Annotation Popup */}
      {showAnnotationPopup && popupPosition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Annotation</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelAnnotation}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Input Area */}
            <div className="p-4">
              <Input
                placeholder="Add annotation..."
                value={newAnnotation}
                onChange={(e) => setNewAnnotation(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newAnnotation.trim()) {
                    addAnnotation()
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
                    setNewAnnotation(prev => prev + '😊')
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
                    setNewAnnotation(prev => prev + '@')
                  }}
                >
                  <span className="text-sm font-bold dark:text-gray-100">@</span>
                </Button>
                
                {/* Attachment Button */}
                 
              </div>
              
              {/* Submit Button */}
              <Button
                size="sm"
                onClick={addAnnotation}
                disabled={!newAnnotation.trim()}
                className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-full"
              >
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Input Popup */}
      {showReplyInput && selectedAnnotationForReply && (
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
                onClick={handleCancelReply}
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
                    className={`w-3 h-3 rounded-full ${
                      selectedAnnotationForReply.isResolved
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
              {selectedAnnotationForReply.isResolved ? (
                <div className="text-center py-4">
                  <div className="text-green-500 mb-2">
                    <CheckCircle className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This annotation has been resolved and cannot be replied to.
                  </p>
                </div>
              ) : (project?.status === 'completed' || (project?.status as string) === "rejected") ? (
                <div className="text-center py-4">
                  <div className="text-orange-500 mb-2">
                    <AlertCircle className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project?.status === 'completed' 
                      ? 'This project has been completed. No further replies can be added.' 
                      : 'This project has been rejected. No further replies can be added.'
                    }
                  </p>
                </div>
              ) : (
                <Input
                  placeholder="Type your reply..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && newReply.trim()) {
                      addReply(selectedAnnotationForReply.id);
                    }
                  }}
                  className="border-0 focus:ring-0 text-sm dark:bg-gray-800 dark:text-gray-100"
                  autoFocus
                />
              )}
            </div>

            {/* Action Bar */}
            {!selectedAnnotationForReply.isResolved && project?.status !== 'completed' && (project?.status as string) !== "rejected" && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {/* Emoji Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => {
                      setNewReply((prev) => prev + "😊");
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
                      setNewReply((prev) => prev + "@");
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
                  onClick={() => addReply(selectedAnnotationForReply.id)}
                  disabled={!newReply.trim()}
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

      {/* Annotation Chat Popup */}
      {showAnnotationChat && selectedAnnotationChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Annotation Conversation
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedAnnotationChat.addedByName} • {new Date(selectedAnnotationChat.createdAt).toLocaleString()}
                </p>
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
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">{selectedAnnotationChat.addedByName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(selectedAnnotationChat.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{selectedAnnotationChat.content}</p>
                </div>
              </div>

              {/* Replies */}
              {selectedAnnotationChat.replies && selectedAnnotationChat.replies.length > 0 ? (
                selectedAnnotationChat.replies.map((reply, index) => {
                  const isFromAdmin = reply.addedBy === 'Admin' || reply.addedByName === 'Admin User';
                  return (
                    <div key={reply.id} className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-lg p-3 max-w-[80%] ${
                        isFromAdmin 
                          ? 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500' 
                          : 'bg-gray-100 dark:bg-gray-800 border-l-4 border-gray-400'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${isFromAdmin ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                          <span className="text-sm font-medium">{reply.addedByName}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(reply.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className={`text-sm ${isFromAdmin ? 'text-gray-800 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300'}`}>
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
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No replies yet. Be the first to respond!</p>
                  <p className="text-xs mt-2">Debug: selectedAnnotationChat.replies = {JSON.stringify(selectedAnnotationChat.replies)}</p>
                </div>
              )}
            </div>

            {/* Reply Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              {/* Show message if project is completed or rejected */}
              {(project?.status === 'completed' || (project?.status as string) === "rejected") ? (
                <div className="text-center py-4">
                  <div className="text-orange-500 mb-2">
                    <AlertCircle className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {project?.status === 'completed' 
                      ? 'This project has been completed. No further replies can be added.' 
                      : 'This project has been rejected. No further replies can be added.'
                    }
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && replyText.trim()) {
                        handleReplySubmit();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleReplySubmit}
                    disabled={!replyText.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Create a new version for this project to organize files and track changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="versionName">Version Name</Label>
              <Input
                id="versionName"
                placeholder="e.g., V2, V3, Final"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="versionDescription">Description (Optional)</Label>
              <Textarea
                id="versionDescription"
                placeholder="Describe what's new in this version..."
                value={newVersionDescription}
                onChange={(e) => setNewVersionDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersionDialog(false)}>
              Cancel
            </Button>
           
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
  