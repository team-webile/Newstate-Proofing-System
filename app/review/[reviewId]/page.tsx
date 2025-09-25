"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"
import { PenTool, X, CheckCircle, AlertCircle, MessageCircle } from "lucide-react"
import ImageAnnotation from "@/components/ImageAnnotation"
import { useRealtimeComments } from "@/hooks/use-realtime-comments"
import io from 'socket.io-client'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Annotation {
  id: string
  x: number
  y: number
  comment: string
  timestamp: string
  resolved: boolean
  fileId: string
}

interface ProjectFile {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
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

interface Revision {
  id: string
  version: string
  status: "in_revision" | "pending_review" | "approved" | "rejected"
  requestedBy: string
  requestedAt: string
  comments: string
  digitalSignature?: {
    firstName: string
    lastName: string
  }
  completedAt?: string
}

interface ReviewPageProps {
  params: {
    reviewId: string
  }
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [fileAnnotations, setFileAnnotations] = useState<{ [key: string]: string[] }>({})
  const [showAnnotationModal, setShowAnnotationModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ProjectFile | null>(null)
  const [socket, setSocket] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<Array<{id: string, type: 'annotation' | 'status', message: string, timestamp: string, addedBy?: string, senderName?: string, isFromClient?: boolean}>>([])
  const [versions, setVersions] = useState<Version[]>([])
  const [currentVersion, setCurrentVersion] = useState("")
  const [currentFile, setCurrentFile] = useState<string>("")
  const [newComment, setNewComment] = useState("")
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false)
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null)
  const [digitalSignature, setDigitalSignature] = useState({ firstName: "", lastName: "" })
  const [showSignatureDialog, setShowSignatureDialog] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showRevisionDialog, setShowRevisionDialog] = useState(false)
  const [revisionComments, setRevisionComments] = useState("")
  const [showVersionComparison, setShowVersionComparison] = useState(false)
  const [compareVersion, setCompareVersion] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewData, setReviewData] = useState<any>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  const currentVersionData = versions.find(v => v.version === currentVersion)
  const currentFileData = currentVersionData?.files.find(f => f.id === currentFile) || currentVersionData?.files[0]

  // Client user info - no authentication required
  const currentUser = {
    name: 'Client',
    role: 'Client'
  }

  // Use real-time comments hook
  const {
    comments: realtimeComments,
    annotations: realtimeAnnotations,
    isLoading: commentsLoading,
    error: commentsError,
    isConnected,
    addComment: addRealtimeComment,
    addAnnotation: addRealtimeAnnotation,
    resolveAnnotation: resolveRealtimeAnnotation,
    updateElementStatus: updateRealtimeElementStatus
  } = useRealtimeComments({
    projectId: reviewData?.project?.id || '',
    elementId: currentFileData?.id,
    fileId: currentFileData?.id,
    currentUser
  })

  // Fetch review data
  const fetchReviewData = async () => {
    try {
      setIsLoading(true)
      
      // Check if we have a file parameter in URL
      const urlParams = new URLSearchParams(window.location.search)
      const fileId = urlParams.get('file')
      
      // First try to get the review
      const reviewResponse = await fetch(`/api/reviews/${params.reviewId}`)
      const reviewData = await reviewResponse.json()
      
      if (reviewData.status === 'success') {
        setReviewData(reviewData.data)
        
        // Transform elements to versions
        if (reviewData.data.elements) {
          const transformedVersions = reviewData.data.elements.map((element: any, index: number) => ({
            id: element.id,
            version: `V${index + 1}`,
            files: element.versions?.map((version: any) => ({
              id: version.id,
              name: version.fileName || element.elementName,
              url: version.filePath,
              type: version.fileType || 'image/jpeg',
              size: version.fileSize || 0,
              uploadedAt: version.createdAt
            })) || [],
            status: (element.status?.toLowerCase() as any) || 'pending_review',
            createdAt: element.createdAt,
            annotations: []
          }))
          setVersions(transformedVersions as any)
          
          // Set first version as current
          if (transformedVersions.length > 0) {
            setCurrentVersion(transformedVersions[0].version)
            
            // If we have a file ID from URL, try to select that file
            if (fileId) {
              // Find the file in any version
              for (const version of transformedVersions) {
                const file = version.files.find((f: any) => f.id === fileId)
                if (file) {
                  setCurrentFile(fileId)
                  break
                }
              }
            } else if (transformedVersions[0].files.length > 0) {
              setCurrentFile(transformedVersions[0].files[0].id)
            }
          }
        }
      } else if (reviewData.status === 'error' && reviewData.message === 'Review not found') {
        // If review not found, get project data directly
        const projectId = params.reviewId.replace('review-', '')
        await fetchProjectData(projectId)
      } else {
        setError(reviewData.message || 'Failed to load review data')
      }
    } catch (error) {
      console.error('Error fetching review data:', error)
      setError('Failed to load review data')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch project data directly if review doesn't exist
  const fetchProjectData = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        // Create mock review data from project
        const mockReviewData = {
          id: `review-${projectId}`,
          reviewName: data.data.title,
          description: data.data.description,
          status: 'IN_PROGRESS',
          project: data.data,
          elements: []
        }
        
        setReviewData(mockReviewData)
        
        // Create mock versions from project files if any
        const mockVersions = [{
          id: '1',
          version: 'V1',
          files: [],
          status: 'pending_review',
          createdAt: data.data.createdAt,
          annotations: []
        }]
        
        setVersions(mockVersions as any)
        setCurrentVersion('V1')
      } else {
        setError('Failed to load project data')
      }
    } catch (error) {
      console.error('Error fetching project data:', error)
      setError('Failed to load project data')
    }
  }

  // Create review for project if it doesn't exist
  const createReviewForProject = async (projectId: string) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Project Review',
          description: 'Review for project',
          projectId: projectId
        })
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        // Retry fetching the review data
        await fetchReviewData()
      } else {
        setError('Failed to create review')
      }
    } catch (error) {
      console.error('Error creating review:', error)
      setError('Failed to create review')
    }
  }

  // Fetch annotations
  const fetchAnnotations = async () => {
    try {
      const response = await fetch(`/api/annotations?projectId=${params.reviewId}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        // Group annotations by fileId
        const annotationsByFile: { [key: string]: string[] } = {}
        data.data.forEach((annotation: any) => {
          if (!annotationsByFile[annotation.fileId]) {
            annotationsByFile[annotation.fileId] = []
          }
          annotationsByFile[annotation.fileId].push(annotation.content)
        })
        setFileAnnotations(annotationsByFile)
      }
    } catch (error) {
      console.error('Error fetching annotations:', error)
    }
  }

  useEffect(() => {
    fetchReviewData()
    fetchAnnotations()
  }, [params.reviewId])

  useEffect(() => {
    if (currentVersionData?.files.length && !currentFile) {
      setCurrentFile(currentVersionData.files[0].id)
    }
  }, [currentVersionData, currentFile])

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingAnnotation || !currentFile) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      x,
      y,
      comment: "",
      timestamp: new Date().toISOString(),
      resolved: false,
      fileId: currentFile,
    }

    setAnnotations([...annotations, newAnnotation])
    setSelectedAnnotation(newAnnotation)
    setIsAddingAnnotation(false)
  }

  const handleAnnotationSubmit = () => {
    if (!selectedAnnotation || !newComment.trim()) return

    const updatedAnnotations = annotations.map((annotation) =>
      annotation.id === selectedAnnotation.id
        ? { ...annotation, comment: newComment }
        : annotation
    )

    setAnnotations(updatedAnnotations)
    setNewComment("")
    setSelectedAnnotation(null)
  }

  const handleAnnotationResolve = (annotationId: string) => {
    const updatedAnnotations = annotations.map((annotation) =>
      annotation.id === annotationId
        ? { ...annotation, resolved: !annotation.resolved }
        : annotation
    )
    setAnnotations(updatedAnnotations)
  }

  const handleRequestRevision = () => {
    if (!revisionComments.trim()) {
      alert("Please provide comments for the revision request")
      return
    }

    const newRevision: Revision = {
      id: Date.now().toString(),
      version: currentVersion,
      status: "in_revision",
      requestedBy: "Client",
      requestedAt: new Date().toISOString(),
      comments: revisionComments,
    }

    setRevisions([...revisions, newRevision])
    
    // Update version status to "in_revision"
    const updatedVersions = versions.map(v => 
      v.version === currentVersion 
        ? { ...v, status: "in_revision" as const }
        : v
    )
    setVersions(updatedVersions)
    
    setRevisionComments("")
    setShowRevisionDialog(false)
    
    console.log("Revision requested:", newRevision)
  }

  const handleVersionChange = (version: string) => {
    setCurrentVersion(version)
    // Load annotations for the selected version
    const versionData = versions.find(v => v.version === version)
    if (versionData) {
      setAnnotations(versionData.annotations || [])
      if (versionData.files.length > 0) {
        setCurrentFile(versionData.files[0].id)
      }
    }
  }

  const handleFileChange = (fileId: string) => {
    setCurrentFile(fileId)
    // Filter annotations for the selected file
    const fileAnnotations = annotations.filter(a => a.fileId === fileId)
    // You might want to update the display of annotations here
  }

  const handleApproval = () => {
    if (!digitalSignature.firstName.trim() || !digitalSignature.lastName.trim()) {
      alert("Please enter both first and last name for digital signature")
      return
    }
    setShowApprovalDialog(true)
  }

  const confirmApproval = () => {
    // Update revision status
    const updatedRevisions = revisions.map(r => 
      r.version === currentVersion 
        ? { 
            ...r, 
            status: "approved" as const,
            digitalSignature: digitalSignature,
            completedAt: new Date().toISOString()
          }
        : r
    )
    setRevisions(updatedRevisions)

    // Update version status
    const updatedVersions = versions.map(v => 
      v.version === currentVersion 
        ? { ...v, status: "approved" as const }
        : v
    )
    setVersions(updatedVersions)
    
    console.log("Approval confirmed with signature:", digitalSignature)
    setShowApprovalDialog(false)
    setShowSignatureDialog(false)
    setDigitalSignature({ firstName: "", lastName: "" })
  }

  const handleRejection = () => {
    setShowRevisionDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500"
      case "rejected": return "bg-red-500"
      case "in_revision": return "bg-yellow-500"
      case "pending_review": return "bg-blue-500"
      case "draft": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved": return "Approved"
      case "rejected": return "Rejected"
      case "in_revision": return "In Revision"
      case "pending_review": return "Pending Review"
      case "draft": return "Draft"
      default: return "Unknown"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const currentFileAnnotations = annotations.filter(a => a.fileId === currentFile)

  // Initialize Socket.io
  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      path: '/api/socketio',
      transports: ['websocket', 'polling']
    })
    
    setSocket(newSocket)
    
    // Join project room
    newSocket.emit('join-project', params.reviewId)
    
    // Listen for annotation updates
    newSocket.on('annotationAdded', (data: { fileId: string, annotation: string, timestamp: string, addedBy?: string, addedByName?: string }) => {
      setFileAnnotations(prev => ({
        ...prev,
        [data.fileId]: [...(prev[data.fileId] || []), data.annotation]
      }))
      
      // Add to chat messages with sender/receiver info
      const senderName = data.addedByName || data.addedBy || 'Unknown'
      const isFromClient = senderName.includes('Client') || senderName === reviewData?.project?.client?.name
      const messageText = isFromClient 
        ? `You sent: "${data.annotation}"`
        : `Received from ${senderName}: "${data.annotation}"`
      
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'annotation',
        message: messageText,
        timestamp: data.timestamp,
        addedBy: senderName,
        senderName: senderName,
        isFromClient: isFromClient
      }])
    })
    
    return () => {
      newSocket.emit('leave-project', params.reviewId)
      newSocket.close()
    }
  }, [params.reviewId])

  // Helper functions
  const isImageFile = (file: ProjectFile) => {
    return file.type.startsWith('image/')
  }

  const openAnnotationModal = (file: ProjectFile) => {
    setSelectedImage(file)
    setShowAnnotationModal(true)
  }

  const addAnnotation = async (fileId: string, annotation: string) => {
    if (!annotation.trim()) return
    
    try {
      // Get current client info
      const currentClient = {
        name: reviewData?.project?.client?.name || 'Client',
        role: 'Client'
      }
      
      // Save to database
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: annotation,
          fileId,
          projectId: params.reviewId,
          addedBy: currentClient.role,
          addedByName: currentClient.name
        })
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        // Update local state
        setFileAnnotations(prev => ({
          ...prev,
          [fileId]: [...(prev[fileId] || []), annotation]
        }))
        
        // Emit to socket
        if (socket && params.reviewId) {
          socket.emit('addAnnotation', {
            projectId: params.reviewId,
            fileId,
            annotation,
            addedBy: currentClient.role,
            addedByName: currentClient.name
          })
        }
      } else {
        console.error('Failed to save annotation:', data.message)
        alert('Failed to save annotation. Please try again.')
      }
    } catch (error) {
      console.error('Error saving annotation:', error)
      alert('Failed to save annotation. Please try again.')
    }
  }

  const removeAnnotation = (fileId: string, index: number) => {
    setFileAnnotations(prev => ({
      ...prev,
      [fileId]: prev[fileId]?.filter((_, i) => i !== index) || []
    }))
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading review...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !reviewData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Review Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || 'The review you are looking for does not exist or you do not have access to it.'}
          </p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
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
              <h1 className="text-xl font-semibold">{reviewData.reviewName || reviewData.project?.title}</h1>
              <p className="text-sm te xt-muted-foreground">Client Review Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              Client Access
            </Badge>
            <Badge
              variant={reviewData.status === "APPROVED" ? "default" : "secondary"}
              className="capitalize"
            >
              {reviewData.status?.toLowerCase()}
            </Badge>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Live" : "Offline"}
            </Badge>
            <Badge variant="outline">
              {currentVersion}
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

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
                        onClick={() => setShowVersionComparison(!showVersionComparison)}
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
                        variant={currentVersion === version.version ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleVersionChange(version.version)}
                        className="flex items-center gap-2"
                      >
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(version.status)}`} />
                        {version.version}
                        <Badge variant="secondary" className="ml-1">
                          {getStatusText(version.status)}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                  
                  {showVersionComparison && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted">
                      <Label className="text-sm font-medium mb-2">Compare with:</Label>
                      <Select value={compareVersion} onValueChange={setCompareVersion}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select version to compare" />
                        </SelectTrigger>
                        <SelectContent>
                          {versions
                            .filter(v => v.version !== currentVersion)
                            .map((version) => (
                              <SelectItem key={version.id} value={version.version}>
                                {version.version} - {getStatusText(version.status)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* File Selection */}
              {currentVersionData && currentVersionData.files.length > 1 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Select File to Review</CardTitle>
                    <CardDescription>Choose which file to review and annotate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentVersionData.files.map((file) => (
                        <div key={file.id} className="relative">
                          <Button
                            variant={currentFile === file.id ? "default" : "outline"}
                            className="h-auto p-4 justify-start w-full"
                            onClick={() => handleFileChange(file.id)}
                          >
                            <div className="flex items-center gap-3 w-full">
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                              <Icons.FolderOpen />
                            </div>
                              <div className="text-left flex-1">
                                <p className="font-medium">{file.name}</p>
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
                                e.stopPropagation()
                                openAnnotationModal(file)
                              }}
                            >
                              <PenTool className="h-4 w-4" />
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
                    Design Review - {currentFileData?.name || "No file selected"}
                    <div className="flex gap-2">
                      <Badge variant={isConnected ? "default" : "secondary"}>
                        {isConnected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Click anywhere on the design to add annotations and feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentFileData && isImageFile(currentFileData) ? (
                    <ImageAnnotation
                      imageUrl={currentFileData.url}
                      imageAlt={currentFileData.name}
                      fileId={currentFileData.id}
                      projectId={reviewData?.project?.id || ''}
                      annotations={realtimeAnnotations}
                      onAnnotationAdd={addRealtimeAnnotation}
                      onAnnotationResolve={resolveRealtimeAnnotation}
                      isAdmin={false}
                      currentUser={currentUser}
                    />
                  ) : currentFileData ? (
                    <div className="relative bg-muted rounded-lg overflow-hidden border-2 border-border">
                      <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Icons.FolderOpen />
                          <p className="text-lg font-medium">{currentFileData.name}</p>
                          <p className="text-sm">This file type cannot be annotated</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Icons.FolderOpen />
                        <p className="text-lg font-medium">No file selected</p>
                        <p className="text-sm">Choose a file from the list above to start reviewing</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comments & Annotations */}
              {(realtimeComments.length > 0 || realtimeAnnotations.length > 0) && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Comments & Annotations ({realtimeComments.length + realtimeAnnotations.length})
                    </CardTitle>
                    <CardDescription>All feedback and annotations for this file</CardDescription>
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
                                <span className="text-sm font-medium">{comment.userName}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {comment.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.createdAt).toLocaleString()}
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
                      
                      {/* Annotations */}
                      {realtimeAnnotations.map((annotation) => (
                        <div key={annotation.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  annotation.resolved ? "bg-green-500" : "bg-red-500"
                                }`} />
                                <span className="text-sm font-medium">
                                  {(annotation as any).addedByName || (annotation as any).addedBy || 'Unknown'}
                                </span>
                                <Badge variant={annotation.resolved ? "default" : "destructive"} className="text-xs">
                                  {annotation.resolved ? "Resolved" : "Pending"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(annotation.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">{annotation.comment}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Position: {annotation.x.toFixed(1)}%, {annotation.y.toFixed(1)}%
                              </p>
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
                          className={`p-4 border rounded-lg ${
                            revision.status === "approved" 
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
                                    revision.status === "approved" 
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
                                    revision.status === "approved" 
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
                                  {new Date(revision.requestedAt).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-sm">{revision.comments}</p>
                              {revision.digitalSignature && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Digital Signature: {revision.digitalSignature.firstName} {revision.digitalSignature.lastName}
                                </p>
                              )}
                              {revision.completedAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Completed: {new Date(revision.completedAt).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
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
                    <p className="text-sm text-muted-foreground">{reviewData.project?.title || reviewData.reviewName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Client</Label>
                    <p className="text-sm text-muted-foreground">{reviewData.project?.client?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Current Version</Label>
                    <p className="text-sm text-muted-foreground">{currentVersion}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Current File</Label>
                    <p className="text-sm text-muted-foreground">{currentFileData?.name || "No file selected"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Version Status</Label>
                    <Badge
                      variant={
                        currentVersionData?.status === "approved" 
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
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Review Status</Label>
                    <Badge
                      variant={
                        reviewData.status === "APPROVED" 
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
                      {new Date(reviewData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Review Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Review Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => setShowSignatureDialog(true)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={currentVersionData?.status === "approved"}
                  >
                    <Icons.CheckCircle />
                    Approve {currentVersion}
                  </Button>
                  
                  <Button
                    onClick={handleRejection}
                    variant="destructive"
                    className="w-full"
                    disabled={currentVersionData?.status === "in_revision"}
                  >
                    <Icons.X />
                    Request Changes
                  </Button>

                  {reviewData.allowDownloads && (
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      <Icons.Download />
                      Download Files
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Version Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Version Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {versions.map((version) => (
                      <div key={version.id} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{version.version}</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(version.status)}`} />
                          <span className="text-xs text-muted-foreground">
                            {getStatusText(version.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Switch between versions using the version buttons</p>
                    <p>• Select different files to review within each version</p>
                    <p>• Click "Add Annotation" to place annotations on specific areas</p>
                    <p>• Use "Compare Versions" to see differences between versions</p>
                    <p>• Click on annotation pins to add or edit comments</p>
                    <p>• Use "Request Changes" to submit revision requests</p>
                    <p>• Approve only when you're satisfied with all changes</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Annotation Comment Dialog */}
      <Dialog open={!!selectedAnnotation} onOpenChange={() => setSelectedAnnotation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Annotation</DialogTitle>
            <DialogDescription>
              Add an annotation for this position{" "}
              {selectedAnnotation && `${selectedAnnotation.x.toFixed(1)}%, ${selectedAnnotation.y.toFixed(1)}%`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your annotation..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAnnotation(null)}>
              Cancel
            </Button>
            <Button onClick={handleAnnotationSubmit}>Save Annotation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Please provide detailed feedback about what changes you'd like to see in the design.
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
            <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
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
              Please enter your first and last name to approve this design. This serves as your digital signature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={digitalSignature.firstName}
                onChange={(e) => setDigitalSignature({ ...digitalSignature, firstName: e.target.value })}
                placeholder="Enter your first name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={digitalSignature.lastName}
                onChange={(e) => setDigitalSignature({ ...digitalSignature, lastName: e.target.value })}
                placeholder="Enter your last name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignatureDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproval}>Continue to Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>
                  <strong>Important:</strong> By approving this design, you confirm that:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>You have reviewed all annotations and comments</li>
                  <li>You are satisfied with the current design</li>
                  <li>You understand that production will begin immediately</li>
                  <li>Any changes after approval may incur additional fees</li>
                </ul>
                <p className="text-sm font-medium">
                  Digital Signature: {digitalSignature.firstName} {digitalSignature.lastName}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApproval} className="bg-green-600 hover:bg-green-700">
              Confirm Approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                {fileAnnotations[selectedImage.id] && fileAnnotations[selectedImage.id].length > 0 ? (
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {fileAnnotations[selectedImage.id].map((annotation, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs font-medium text-green-600">
                              {reviewData?.project?.client?.name || 'Client'}
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
                          onClick={() => removeAnnotation(selectedImage.id, index)}
                          className="text-destructive hover:text-destructive flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No annotations yet</p>
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
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        addAnnotation(selectedImage.id, e.currentTarget.value.trim())
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      if (input.value.trim()) {
                        addAnnotation(selectedImage.id, input.value.trim())
                        input.value = ''
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
            <Button variant="outline" onClick={() => setShowAnnotationModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}