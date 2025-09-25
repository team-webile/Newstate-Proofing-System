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

interface Client {
  id: string
  name: string
  email: string
  company?: string
}

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
  status: "draft" | "pending" | "approved" | "revisions" | "active" | "archived" | "completed"
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
  const [isSaving, setIsSaving] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [clientsError, setClientsError] = useState<string | null>(null)

  const fetchClients = async () => {
    try {
      setClientsLoading(true)
      setClientsError(null)
      
      const response = await fetch('/api/clients')
      const data = await response.json()
      
      if (data.status === 'success') {
        setClients(data.data.clients || [])
      } else {
        setClientsError(data.message || 'Failed to fetch clients')
      }
    } catch (err) {
      setClientsError('Failed to fetch clients')
    } finally {
      setClientsLoading(false)
    }
  }


  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch both project and clients in parallel
        const [projectResponse, clientsResponse] = await Promise.all([
          fetch(`/api/projects/${params.projectId}`),
          fetch('/api/clients')
        ])
        
        const [projectData, clientsData] = await Promise.all([
          projectResponse.json(),
          clientsResponse.json()
        ])
        
        // Handle project data
        if (projectData.status === 'success') {
          const projectInfo = projectData.data
          const projectWithLink = {
            id: projectInfo.id,
            name: projectInfo.title,
            clientId: projectInfo.clientId,
            description: projectInfo.description || "",
            files: [], // Files will be handled separately
            allowDownloads: projectInfo.downloadEnabled,
            emailNotifications: projectInfo.emailNotifications ?? true,
            publicLink: `${window.location.origin}/client/${projectInfo.clientId}?project=${projectInfo.id}`,
            status: projectInfo.status.toLowerCase(),
            createdAt: projectInfo.createdAt,
            lastActivity: projectInfo.lastActivity ? new Date(projectInfo.lastActivity).toLocaleDateString() : "Unknown",
          }
          setProject(projectWithLink)
        } else {
          console.error('Failed to fetch project:', projectData.message)
        }
        
        // Handle clients data
        if (clientsData.status === 'success') {
          setClients(clientsData.data.clients || [])
        } else {
          setClientsError(clientsData.message || 'Failed to fetch clients')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setClientsError('Failed to fetch data')
      } finally {
        setIsLoading(false)
        setClientsLoading(false)
      }
    }
    
    fetchData()
  }, [params.projectId])

  const handleFileUpload = async (file: File) => {
    if (!project) return
    
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('version', 'V1')
      
      const response = await fetch(`/api/projects/${project.id}/files`, {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        const uploadedFile: ProjectFile = {
          id: data.data.id,
          name: data.data.name,
          url: data.data.url,
          type: data.data.type,
          size: data.data.size,
          uploadedAt: data.data.uploadedAt,
        }

        setProject(prev => prev ? {
          ...prev,
          files: [...prev.files, uploadedFile]
        } : null)
        
        alert('File uploaded successfully!')
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setIsUploading(false)
      setNewFile(null)
      setShowFileDialog(false)
    }
  }

  const handleFileRemove = async (fileId: string) => {
    if (!project) return
    
    try {
      // Find the file to get its name
      const fileToDelete = project.files.find(file => file.id === fileId)
      
      if (!fileToDelete) {
        alert('File not found')
        return
      }
      
      // Extract filename from URL (e.g., "/uploads/projects/.../filename.jpg" -> "filename.jpg")
      const fileName = fileToDelete.url.split('/').pop()
      
      if (!fileName) {
        alert('Invalid file name')
        return
      }
      
      // Call delete API
      const response = await fetch(`/api/projects/${project.id}/files?fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        // Remove file from frontend state
        setProject(prev => prev ? {
          ...prev,
          files: prev.files.filter(file => file.id !== fileId)
        } : null)
        alert('File deleted successfully!')
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete file. Please try again.')
    }
  }

  const handleSaveProject = async () => {
    if (!project) return
    
    try {
      setIsSaving(true)
      
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: project.name,
          description: project.description,
          status: project.status.toUpperCase(),
          downloadEnabled: project.allowDownloads,
          clientId: project.clientId,
          emailNotifications: project.emailNotifications,
        }),
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        alert("Project updated successfully!")
        // Optionally redirect back to projects list
        // window.location.href = '/admin/projects'
      } else {
        alert(`Error: ${data.message || 'Failed to update project'}`)
      }
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Failed to update project. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyLink = async () => {
    if (!project) return
    
    try {
      await navigator.clipboard.writeText(project.publicLink)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000) // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy:', error)
      alert("Failed to copy link. Please try again.")
    }
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
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <Icons.Loader2 />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                <>
                  <Icons.Save />
                  <span className="ml-2">Save Changes</span>
                </>
              )}
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
                <p className="text-muted-foreground">Edit project details and manage files</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                <Button 
                  variant="outline" 
                  onClick={handleCopyLink}
                  className={isCopied ? "bg-green-100 text-green-700 border-green-300" : ""}
                >
                  {isCopied ? (
                    <>
                      <div className="h-4 w-4 flex items-center"><Icons.CheckCircle /></div>
                      <span className="ml-2">Copied</span>
                    </>
                  ) : (
                    <>
                      <Icons.Copy />
                      <span className="ml-2">Copy Link</span>
                    </>
                  )}
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
                    {clientsLoading ? (
                      <div className="flex items-center gap-2">
                        <Icons.Loader2 />
                        <span className="text-sm text-muted-foreground">Loading clients...</span>
                      </div>
                    ) : clientsError ? (
                      <div className="text-sm text-destructive">
                        {clientsError}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={fetchClients}
                          className="ml-2"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : (
                      <Select 
                        value={project.clientId} 
                        onValueChange={(value) => setProject(prev => prev ? { ...prev, clientId: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} {client.company && `(${client.company})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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

                  <div>
                    <Label htmlFor="status">Project Status</Label>
                    <Select 
                      value={project.status} 
                      onValueChange={(value) => setProject(prev => prev ? { ...prev, status: value as "active" | "archived" | "completed" } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <p className="text-sm text-muted-foreground">{new Date(project.lastActivity).toLocaleDateString()}</p>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyLink} 
                      className={`flex-1 ${isCopied ? "bg-green-100 text-green-700 border-green-300" : ""}`}
                    >
                      {isCopied ? (
                        <>
                          <div className="h-4 w-4 flex items-center"><Icons.CheckCircle /></div>
                          <span className="ml-2">Copied</span>
                        </>
                      ) : (
                        <>
                          <Icons.Copy />
                          <span className="ml-2">Copy Link</span>
                        </>
                      )}
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
