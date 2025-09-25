"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/logo'
import { Icons } from '@/components/icons'
import ImageAnnotation from '@/components/ImageAnnotation'
import { useRealtimeComments } from '@/hooks/use-realtime-comments'
import { Eye, MessageSquare, CheckCircle, X, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
} from '@/components/ui/alert-dialog'

interface ProjectFile {
  id: string
  name: string
  url: string
  fullUrl: string
  type: string
  size: number
  uploadedAt: string
  version: string
}

interface Element {
  id: string
  elementName: string
  status: string
  createdAt: string
  updatedAt: string
  versions: Array<{
    id: string
    filename: string
    filePath: string
    fileSize: number
    mimeType: string
    createdAt: string
    imageUrl: string
  }>
}

interface Project {
  id: string
  title: string
  description: string
  status: string
  downloadEnabled: boolean
  emailNotifications: boolean
  lastActivity: string
  createdAt: string
  updatedAt: string
  client: {
    id: string
    name: string
    email: string
    company: string
  }
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  files: ProjectFile[]
}

interface Review {
  id: string
  reviewName: string
  description: string
  status: string
  shareLink: string
  createdAt: string
  updatedAt: string
  project: Project
  elements: Element[]
}

interface ClientReviewPageProps {
  params: {
    shareLink: string
  }
}

export default function ClientReviewPage({ params }: ClientReviewPageProps) {
  const [review, setReview] = useState<Review | null>(null)
  const [selectedElement, setSelectedElement] = useState<Element | null>(null)
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusComment, setStatusComment] = useState('')

  // Get current user info (in a real app, this would come from authentication)
  const currentUser = {
    name: 'Client User',
    role: 'Client'
  }

  // Use real-time comments hook
  const {
    comments,
    annotations,
    isLoading: commentsLoading,
    error: commentsError,
    isConnected,
    addComment,
    addAnnotation,
    resolveAnnotation,
    updateElementStatus
  } = useRealtimeComments({
    projectId: review?.project.id || '',
    elementId: selectedElement?.id,
    fileId: selectedFile?.id,
    currentUser
  })

  // Fetch review data
  const fetchReview = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/reviews/${params.shareLink}`)
      const data = await response.json()

      if (data.status === 'success') {
        setReview(data.data)
        
        // Select first element and file if available
        if (data.data.elements && data.data.elements.length > 0) {
          setSelectedElement(data.data.elements[0])
          if (data.data.elements[0].versions && data.data.elements[0].versions.length > 0) {
            const firstVersion = data.data.elements[0].versions[0]
            setSelectedFile({
              id: firstVersion.id,
              name: firstVersion.filename,
              url: firstVersion.filePath,
              fullUrl: firstVersion.imageUrl || firstVersion.filePath,
              type: firstVersion.mimeType,
              size: firstVersion.fileSize,
              uploadedAt: firstVersion.createdAt,
              version: 'V1'
            })
          }
        }
      } else {
        setError(data.message || 'Failed to load review')
      }
    } catch (err) {
      console.error('Error fetching review:', err)
      setError('Failed to load review')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReview()
  }, [params.shareLink])

  const handleElementSelect = (element: Element) => {
    setSelectedElement(element)
    if (element.versions && element.versions.length > 0) {
      const firstVersion = element.versions[0]
      setSelectedFile({
        id: firstVersion.id,
        name: firstVersion.filename,
        url: firstVersion.filePath,
        fullUrl: firstVersion.imageUrl || firstVersion.filePath,
        type: firstVersion.mimeType,
        size: firstVersion.fileSize,
        uploadedAt: firstVersion.createdAt,
        version: 'V1'
      })
    }
  }

  const handleFileSelect = (file: ProjectFile) => {
    setSelectedFile(file)
  }

  const handleStatusUpdate = async () => {
    if (!selectedElement || !newStatus) return

    try {
      await updateElementStatus(newStatus, statusComment)
      setShowStatusDialog(false)
      setNewStatus('')
      setStatusComment('')
      
      // Refresh review data
      await fetchReview()
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'in_revision':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <X className="h-4 w-4" />
      case 'pending':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isImageFile = (file: ProjectFile) => {
    return file.type.startsWith('image/')
  }

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

  if (error || !review) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 text-muted-foreground mx-auto mb-4"><Icons.FolderOpen /></div>
          <h3 className="text-lg font-medium mb-2">Review not found</h3>
          <p className="text-muted-foreground mb-4">{error || 'The review you\'re looking for doesn\'t exist.'}</p>
          <Button onClick={() => window.location.reload()}>
            <Icons.RefreshCw />
            <span className="ml-2">Try Again</span>
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
            <Logo />
            <div>
              <h1 className="text-xl font-semibold">{review.project.title}</h1>
              <p className="text-sm text-muted-foreground">Client Review Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Badge className={getStatusColor(review.status)}>
              {review.status}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Elements Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Design Elements</CardTitle>
                  <CardDescription>Select an element to review</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {review.elements.map((element) => (
                    <Button
                      key={element.id}
                      variant={selectedElement?.id === element.id ? "default" : "outline"}
                      className="w-full justify-start h-auto p-4"
                      onClick={() => handleElementSelect(element)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                          <Icons.FolderOpen />
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-medium">{element.elementName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="secondary" 
                              className={getStatusColor(element.status)}
                            >
                              {getStatusIcon(element.status)}
                              <span className="ml-1">{element.status}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Project Files */}
              {review.project.files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Project Files</CardTitle>
                    <CardDescription>Additional project files</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {review.project.files.map((file) => (
                      <Button
                        key={file.id}
                        variant={selectedFile?.id === file.id ? "default" : "outline"}
                        className="w-full justify-start h-auto p-3"
                        onClick={() => handleFileSelect(file)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                            <Icons.FolderOpen />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Review Area */}
            <div className="lg:col-span-3 space-y-6">
              {selectedElement && selectedFile && isImageFile(selectedFile) ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {selectedElement.elementName}
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(selectedElement.status)}>
                          {getStatusIcon(selectedElement.status)}
                          <span className="ml-1">{selectedElement.status}</span>
                        </Badge>
                        <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Update Status
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Update Element Status</AlertDialogTitle>
                              <AlertDialogDescription>
                                Choose the new status for this element
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <select
                                  value={newStatus}
                                  onChange={(e) => setNewStatus(e.target.value)}
                                  className="w-full p-2 border rounded-md"
                                >
                                  <option value="">Select Status</option>
                                  <option value="APPROVED">Approve</option>
                                  <option value="REJECTED">Reject</option>
                                  <option value="IN_REVISION">Request Revision</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Comment (Optional)</label>
                                <textarea
                                  value={statusComment}
                                  onChange={(e) => setStatusComment(e.target.value)}
                                  className="w-full p-2 border rounded-md"
                                  rows={3}
                                  placeholder="Add a comment about your decision..."
                                />
                              </div>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleStatusUpdate}>
                                Update Status
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Click anywhere on the image to add annotations and feedback
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageAnnotation
                      imageUrl={selectedFile.fullUrl}
                      imageAlt={selectedFile.name}
                      fileId={selectedFile.id}
                      projectId={review.project.id}
                      annotations={annotations}
                      onAnnotationAdd={addAnnotation}
                      onAnnotationResolve={resolveAnnotation}
                      isAdmin={false}
                      currentUser={currentUser}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Icons.FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Select an element to start reviewing</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comments Section */}
              {selectedElement && comments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Comments & Feedback</CardTitle>
                    <CardDescription>All comments for this element</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {comments.map((comment) => (
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
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
