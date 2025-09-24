"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoutButton } from "@/components/logout-button"
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
}

interface Version {
  id: string
  version: string
  files: ProjectFile[]
  status: "draft" | "pending_review" | "approved" | "rejected"
  createdAt: string
  notes?: string
}

interface Project {
  id: string
  name: string
  clientId: string
  description: string
  allowDownloads: boolean
  emailNotifications: boolean
  publicLink: string
  status: "draft" | "pending" | "approved" | "revisions"
  createdAt: string
  lastActivity: string
}

interface ProjectFilesPageProps {
  params: {
    projectId: string
  }
}

export default function ProjectFilesPage({ params }: ProjectFilesPageProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [versions, setVersions] = useState<Version[]>([
    {
      id: "1",
      version: "V1",
      files: [],
      status: "draft",
      createdAt: new Date().toISOString(),
    }
  ])
  const [currentVersion, setCurrentVersion] = useState("V1")
  const [isUploading, setIsUploading] = useState(false)
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [newVersionName, setNewVersionName] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Mock clients data - will be replaced with real data
  const clients = [
    { id: "1", name: "Atlantic Wellness" },
    { id: "2", name: "Provectus Corp" },
    { id: "3", name: "Health Plus" },
    { id: "4", name: "Woody's Restaurant" },
  ]

  // Mock project data - will be replaced with real data fetching
  const mockProject: Project = {
    id: params.projectId,
    name: "Atlantic Spa",
    clientId: "1",
    description: "Spa branding and interior design concepts",
    allowDownloads: true,
    emailNotifications: true,
    publicLink: "", // Will be set in useEffect
    status: "draft",
    createdAt: "2024-01-15T09:00:00Z",
    lastActivity: "2 days ago",
  }

  useEffect(() => {
    // Simulate loading project data
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const projectWithLink = {
          ...mockProject,
          publicLink: `${window.location.origin}/review/${params.projectId}-atlantic-spa`
        }
        setProject(projectWithLink)
      } else {
        setProject(mockProject)
      }
      setIsLoading(false)
    }, 1000)
  }, [params.projectId])

  const handleFileUpload = async (file: File) => {
    if (!project) return
    
    setIsUploading(true)
    
    // Simulate file upload - in real implementation, upload to your server
    const uploadedFile: ProjectFile = {
      id: Date.now().toString(),
      name: file.name,
      url: URL.createObjectURL(file), // In real app, this would be server URL
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      version: currentVersion,
    }

    setVersions(prev => prev.map(v => 
      v.version === currentVersion 
        ? { ...v, files: [...v.files, uploadedFile] }
        : v
    ))
    
    setIsUploading(false)
    setNewFile(null)
    setShowFileDialog(false)
  }

  const handleFileRemove = (fileId: string) => {
    setVersions(prev => prev.map(v => 
      v.version === currentVersion 
        ? { ...v, files: v.files.filter(file => file.id !== fileId) }
        : v
    ))
  }

  const handleCreateVersion = () => {
    if (!newVersionName.trim()) {
      alert("Please enter a version name")
      return
    }

    const newVersion: Version = {
      id: Date.now().toString(),
      version: newVersionName,
      files: [],
      status: "draft",
      createdAt: new Date().toISOString(),
    }

    setVersions(prev => [...prev, newVersion])
    setCurrentVersion(newVersionName)
    setNewVersionName("")
    setShowVersionDialog(false)
  }

  const handleVersionChange = (version: string) => {
    setCurrentVersion(version)
  }

  const handlePublishVersion = () => {
    setVersions(prev => prev.map(v => 
      v.version === currentVersion 
        ? { ...v, status: "pending_review" as const }
        : v
    ))
    
    // Update project status
    setProject(prev => prev ? { ...prev, status: "pending" as const } : null)
    
    alert("Version published for client review!")
  }

  const handleSaveProject = () => {
    if (!project) return
    
    // Here you would typically save to your backend
    console.log("Saving project:", project)
    console.log("Saving versions:", versions)
    
    alert("Project updated successfully!")
  }

  const handleCopyLink = () => {
    if (!project) return
    
    navigator.clipboard.writeText(project.publicLink)
    alert("Shareable link copied to clipboard!")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status: string) => {
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

  const getVersionStatusColor = (status: string) => {
    switch (status) {
      case "pending_review":
        return "bg-blue-500"
      case "approved":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      case "draft":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getVersionStatusText = (status: string) => {
    switch (status) {
      case "pending_review": return "Pending Review"
      case "approved": return "Approved"
      case "rejected": return "Rejected"
      case "draft": return "Draft"
      default: return "Unknown"
    }
  }

  const currentVersionData = versions.find(v => v.version === currentVersion)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
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
          <Button onClick={() => window.location.href = "/admin/projects"}>
            Back to Projects
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
              onClick={() => (window.location.href = "/admin/projects")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icons.ArrowLeft />
              <span className="ml-2">Back to Projects</span>
            </Button>
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
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
                  {project.id} - {project.name}
                </h1>
                <p className="text-muted-foreground">Manage files and versions for client review</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                <Button variant="outline" onClick={handleCopyLink}>
                  <Icons.Copy />
                  <span className="ml-2">Copy Link</span>
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
                    <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
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
                              onChange={(e) => setNewVersionName(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowVersionDialog(false)}>
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
                      <Button
                        key={version.id}
                        variant={currentVersion === version.version ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleVersionChange(version.version)}
                        className="flex items-center gap-2"
                      >
                        <div className={`w-2 h-2 rounded-full ${getVersionStatusColor(version.status)}`} />
                        {version.version}
                        <Badge variant="secondary" className="ml-1">
                          {getVersionStatusText(version.status)}
                        </Badge>
                      </Button>
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
                      <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
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
                                  const file = e.target.files?.[0]
                                  if (file) setNewFile(file)
                                }}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowFileDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => newFile && handleFileUpload(newFile)}
                              disabled={!newFile || isUploading}
                            >
                              {isUploading ? "Uploading..." : "Upload"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {currentVersionData?.files.length > 0 && (
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
                    Upload and manage design files for client review. Supported formats: JPG, PNG, PDF, PSD, AI, EPS
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentVersionData && currentVersionData.files.length > 0 ? (
                    <div className="space-y-3">
                      {currentVersionData.files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                              <Icons.FolderOpen />
                            </div>
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <Icons.ExternalLink />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFileRemove(file.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Icons.Trash />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="h-12 w-12 mx-auto mb-4 opacity-50"><Icons.FolderOpen /></div>
                      <p>No files uploaded yet</p>
                      <p className="text-sm">Click "Add Files" to upload design files for {currentVersion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Project Settings & Info */}
            <div className="space-y-6">
              {/* Project Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                  <CardDescription>Project details and statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Project ID</Label>
                    <p className="text-sm text-muted-foreground">{project.id}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Project Name</Label>
                    <p className="text-sm text-muted-foreground">{project.name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Client</Label>
                    <p className="text-sm text-muted-foreground">
                      {clients.find(c => c.id === project.clientId)?.name}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Current Version</Label>
                    <p className="text-sm text-muted-foreground">{currentVersion}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Files in Current Version</Label>
                    <p className="text-sm text-muted-foreground">{currentVersionData?.files.length || 0} files</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Shareable Link */}
              <Card>
                <CardHeader>
                  <CardTitle>Shareable Link</CardTitle>
                  <CardDescription>Share this link with your client</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-mono break-all">{project.publicLink}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex-1">
                      <Icons.Copy />
                      <span className="ml-2">Copy Link</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(project.publicLink, '_blank')}>
                      <Icons.ExternalLink />
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
    </div>
  )
}
