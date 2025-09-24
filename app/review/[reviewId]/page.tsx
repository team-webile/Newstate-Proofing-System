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
  status: "draft" | "pending_review" | "approved" | "rejected"
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
  const [versions, setVersions] = useState<Version[]>([
    {
      id: "1",
      version: "V1",
      files: [
        {
          id: "1",
          name: "spa-logo-design.psd",
          url: "/professional-tent-canopy-design-with-river-s-life-.jpg",
          type: "image/psd",
          size: 2048576,
          uploadedAt: "2024-01-15T10:00:00Z",
        },
        {
          id: "2",
          name: "interior-mockup.jpg",
          url: "/blue-tent-canopy-design.jpg",
          type: "image/jpeg",
          size: 1024768,
          uploadedAt: "2024-01-15T11:30:00Z",
        },
      ],
      status: "pending_review",
      createdAt: "2024-01-10T10:00:00Z",
      annotations: [],
    },
    {
      id: "2", 
      version: "V2",
      files: [
        {
          id: "3",
          name: "spa-logo-design-v2.psd",
          url: "/professional-tent-canopy-design-with-river-s-life-.jpg",
          type: "image/psd",
          size: 2048576,
          uploadedAt: "2024-01-12T14:30:00Z",
        },
        {
          id: "4",
          name: "interior-mockup-v2.jpg",
          url: "/blue-tent-canopy-design.jpg",
          type: "image/jpeg",
          size: 1024768,
          uploadedAt: "2024-01-12T15:00:00Z",
        },
      ],
      status: "draft",
      createdAt: "2024-01-12T14:30:00Z",
      annotations: [],
    }
  ])
  const [currentVersion, setCurrentVersion] = useState("V1")
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
  const imageRef = useRef<HTMLDivElement>(null)

  // Mock data - will be replaced with real data fetching
  const reviewData = {
    id: params.reviewId,
    projectName: "Atlantic Spa",
    clientName: "Atlantic Wellness",
    status: "pending",
    description: "Spa branding and interior design concepts",
    deadline: "2024-01-15",
    notes: "Please review the design files and provide feedback. Click on any area of the design to add annotations.",
    allowDownloads: true,
  }

  const currentVersionData = versions.find(v => v.version === currentVersion)
  const currentFileData = currentVersionData?.files.find(f => f.id === currentFile) || currentVersionData?.files[0]

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
              <h1 className="text-xl font-semibold">{reviewData.projectName}</h1>
              <p className="text-sm text-muted-foreground">{reviewData.clientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant={reviewData.status === "approved" ? "default" : "secondary"}
              className="capitalize"
            >
              {reviewData.status}
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
                        <Button
                          key={file.id}
                          variant={currentFile === file.id ? "default" : "outline"}
                          className="h-auto p-4 justify-start"
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingAnnotation(!isAddingAnnotation)}
                        className={isAddingAnnotation ? "bg-primary text-primary-foreground" : ""}
                      >
                        <Icons.Plus />
                        {isAddingAnnotation ? "Cancel Annotation" : "Add Annotation"}
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {isAddingAnnotation
                      ? "Click anywhere on the design to add an annotation"
                      : reviewData.notes}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div
                      ref={imageRef}
                      className="relative cursor-crosshair bg-muted rounded-lg overflow-hidden"
                      onClick={handleImageClick}
                    >
                      {currentFileData ? (
                        <img
                          src={currentFileData.url}
                          alt={currentFileData.name}
                          className="w-full h-auto"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <Icons.FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No file selected</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Render annotations for current file */}
                      {currentFileAnnotations.map((annotation) => (
                        <div
                          key={annotation.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                          style={{
                            left: `${annotation.x}%`,
                            top: `${annotation.y}%`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedAnnotation(annotation)
                          }}
                        >
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              annotation.resolved
                                ? "bg-green-500 border-green-600"
                                : "bg-red-500 border-red-600"
                            }`}
                          >
                            <Icons.MessageCircle />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Annotations List */}
              {currentFileAnnotations.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Annotations ({currentFileAnnotations.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {currentFileAnnotations.map((annotation) => (
                        <div
                          key={annotation.id}
                          className={`p-4 border rounded-lg ${
                            annotation.resolved ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    annotation.resolved ? "bg-green-500" : "bg-red-500"
                                  }`}
                                />
                                <span className="text-sm text-muted-foreground">
                                  Position: {annotation.x.toFixed(1)}%, {annotation.y.toFixed(1)}%
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(annotation.timestamp).toLocaleString()}
                                </span>
                              </div>
                              {annotation.comment ? (
                                <p className="text-sm">{annotation.comment}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">
                                  Click to add annotation
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAnnotationResolve(annotation.id)}
                            >
                              {annotation.resolved ? (
                                <Icons.CheckCircle />
                              ) : (
                                <Icons.AlertCircle />
                              )}
                            </Button>
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
                                  {new Date(revision.requestedAt).toLocaleString()}
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
                                  Completed: {new Date(revision.completedAt).toLocaleString()}
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
                    <p className="text-sm text-muted-foreground">{reviewData.projectName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Client</Label>
                    <p className="text-sm text-muted-foreground">{reviewData.clientName}</p>
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
                    <Label className="text-sm font-medium">Deadline</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(reviewData.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Downloads</Label>
                    <Badge variant={reviewData.allowDownloads ? "default" : "secondary"}>
                      {reviewData.allowDownloads ? "Allowed" : "Disabled"}
                    </Badge>
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
    </div>
  )
}