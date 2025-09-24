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

interface ProjectFile {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
}

interface Project {
  id: string
  name: string
  clientId: string
  description: string
  files: ProjectFile[]
  allowDownloads: boolean
  emailNotifications: boolean
  publicLink: string
  status: "draft" | "pending" | "approved" | "revisions"
  createdAt: string
  lastActivity: string
}

interface ProjectEditPageProps {
  params: {
    projectId: string
  }
}

export default function ProjectEditPage({ params }: ProjectEditPageProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [newFile, setNewFile] = useState<File | null>(null)
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
    allowDownloads: true,
    emailNotifications: true,
    publicLink: "", // Will be set in useEffect
    status: "pending",
    createdAt: "2024-01-15T09:00:00Z",
    lastActivity: "2 days ago",
  }

  useEffect(() => {
    // Simulate loading project data
    setTimeout(() => {
      const projectWithLink = {
        ...mockProject,
        publicLink: `${window.location.origin}/review/${params.projectId}-atlantic-spa`
      }
      setProject(projectWithLink)
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
    }

    setProject(prev => prev ? {
      ...prev,
      files: [...prev.files, uploadedFile]
    } : null)
    
    setIsUploading(false)
    setNewFile(null)
    setShowFileDialog(false)
  }

  const handleFileRemove = (fileId: string) => {
    if (!project) return
    
    setProject(prev => prev ? {
      ...prev,
      files: prev.files.filter(file => file.id !== fileId)
    } : null)
  }

  const handleSaveProject = () => {
    if (!project) return
    
    // Here you would typically save to your backend
    console.log("Saving project:", project)
    
    // Show success message
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
          <div className="h-12 w-12 text-muted-foreground mx-auto mb-4">
            <Icons.FolderOpen />
          </div>
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
                <p className="text-muted-foreground">Edit project details and manage files</p>
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
            {/* Project Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                  <CardDescription>Basic details about the project</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      value={project.name}
                      onChange={(e) => setProject(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="client">Client</Label>
                    <Select 
                      value={project.clientId} 
                      onValueChange={(value) => setProject(prev => prev ? { ...prev, clientId: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={project.description}
                      onChange={(e) => setProject(prev => prev ? { ...prev, description: e.target.value } : null)}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* File Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Project Files ({project.files.length})
                    <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Icons.Plus />
                          <span className="ml-2">Add More Files</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload Additional Files</DialogTitle>
                          <DialogDescription>
                            Add more files to this project for client review
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
                  </CardTitle>
                  <CardDescription>
                    Manage design files for client review. You can add more files at any time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.files.map((file) => (
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
                </CardContent>
              </Card>
            </div>

            {/* Project Settings & Info */}
            <div className="space-y-6">
              {/* Project Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Settings</CardTitle>
                  <CardDescription>Configure project options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="downloads">Allow Downloads</Label>
                      <p className="text-sm text-muted-foreground">Clients can download files</p>
                    </div>
                    <Switch
                      id="downloads"
                      checked={project.allowDownloads}
                      onCheckedChange={(checked) => setProject(prev => prev ? { ...prev, allowDownloads: checked } : null)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send email updates</p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={project.emailNotifications}
                      onCheckedChange={(checked) => setProject(prev => prev ? { ...prev, emailNotifications: checked } : null)}
                    />
                  </div>
                </CardContent>
              </Card>

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
                    <Label className="text-sm font-medium">Client</Label>
                    <p className="text-sm text-muted-foreground">
                      {clients.find(c => c.id === project.clientId)?.name}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Files Count</Label>
                    <p className="text-sm text-muted-foreground">{project.files.length} files</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Last Activity</Label>
                    <p className="text-sm text-muted-foreground">{project.lastActivity}</p>
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

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Edit project details as needed</p>
                    <p>• Add more files using "Add More Files"</p>
                    <p>• Configure download and notification settings</p>
                    <p>• Copy shareable link to send to client</p>
                    <p>• Save changes to update the project</p>
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
