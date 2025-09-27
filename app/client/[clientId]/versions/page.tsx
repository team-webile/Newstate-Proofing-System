"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

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
  clientFeedback?: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
}

interface Project {
  id: string
  name: string
  clientId: string
  description: string
  status: string
  createdAt: string
}

interface ClientVersionsPageProps {
  params: {
    clientId: string
  }
}

export default function ClientVersionsPage({ params }: ClientVersionsPageProps) {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const { toast } = useToast()
  
  const [project, setProject] = useState<Project | null>(null)
  const [versions, setVersions] = useState<Version[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])

  // Fetch project data
  const fetchProject = async () => {
    if (!projectId) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        setProject(data.data)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    }
  }

  // Fetch versions
  const fetchVersions = async () => {
    if (!projectId) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}/versions`)
      const data = await response.json()
      
      if (data.status === 'success') {
        setVersions(data.data)
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
    }
  }

  // Fetch project files
  const fetchProjectFiles = async () => {
    if (!projectId) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}/files`)
      const data = await response.json()
      
      if (data.status === 'success' && data.data.files) {
        const files = data.data.files.map((file: any) => ({
          id: file.id,
          name: file.name,
          url: file.url,
          type: file.type,
          size: file.size,
          uploadedAt: file.uploadedAt,
          version: file.version
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
      }
    } catch (error) {
      console.error('Error fetching project files:', error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchProject(),
        fetchVersions(),
        fetchProjectFiles()
      ])
      setIsLoading(false)
    }
    
    fetchData()
  }, [projectId])

  const handleApproveVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/versions/${versionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: 'Client',
          approvedAt: new Date().toISOString()
        })
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        setVersions(prev => prev.map(v => 
          v.id === versionId 
            ? { 
                ...v, 
                status: "approved" as const,
                approvedBy: 'Client',
                approvedAt: new Date().toISOString()
              }
            : v
        ))
        
        toast({
          title: "Success",
          description: "Version approved successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to approve version",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error approving version:', error)
      toast({
        title: "Error",
        description: "Failed to approve version. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleRejectVersion = async (versionId: string, feedback: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/versions/${versionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectedBy: 'Client',
          rejectedAt: new Date().toISOString(),
          clientFeedback: feedback
        })
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        setVersions(prev => prev.map(v => 
          v.id === versionId 
            ? { 
                ...v, 
                status: "rejected" as const,
                rejectedBy: 'Client',
                rejectedAt: new Date().toISOString(),
                clientFeedback: feedback
              }
            : v
        ))
        
        toast({
          title: "Success",
          description: "Version rejected with feedback!",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to reject version",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error rejecting version:', error)
      toast({
        title: "Error",
        description: "Failed to reject version. Please try again.",
        variant: "destructive"
      })
    }
  }

  const toggleVersionSelection = (versionId: string) => {
    setSelectedVersions(prev => 
      prev.includes(versionId) 
        ? prev.filter(id => id !== versionId)
        : [...prev, versionId]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_review":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "approved":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "draft":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      default:
        return "bg-muted text-muted-foreground"
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

  const isImageFile = (file: ProjectFile) => {
    return file.type.startsWith('image/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading versions...</p>
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
              <h1 className="text-xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">Version Comparison</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Version Comparison</h2>
            <p className="text-muted-foreground">
              Review and compare all versions of your project. Select versions to compare side by side.
            </p>
          </div>

          {/* Version Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Versions to Compare</CardTitle>
              <CardDescription>
                Choose multiple versions to compare them side by side
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {versions.map((version) => (
                  <Button
                    key={version.id}
                    variant={selectedVersions.includes(version.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleVersionSelection(version.id)}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      version.status === 'approved' ? 'bg-green-500' :
                      version.status === 'rejected' ? 'bg-red-500' :
                      version.status === 'pending_review' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} />
                    {version.version}
                    <Badge variant="secondary" className="ml-1">
                      {getVersionStatusText(version.status)}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Version Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {versions.map((version) => (
              <Card key={version.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{version.version}</CardTitle>
                      <CardDescription>
                        Created {new Date(version.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(version.status)}>
                      {getVersionStatusText(version.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Version Files */}
                  <div className="space-y-3 mb-4">
                    {version.files.map((file) => (
                      <div key={file.id} className="border rounded-lg overflow-hidden">
                        {isImageFile(file) ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="h-48 bg-muted flex items-center justify-center">
                            <div className="text-center">
                              <Icons.File className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">{file.name}</p>
                            </div>
                          </div>
                        )}
                        <div className="p-3">
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Version Actions */}
                  {version.status === "pending_review" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveVersion(version.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Icons.CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const feedback = prompt("Please provide feedback for rejection:")
                          if (feedback) {
                            handleRejectVersion(version.id, feedback)
                          }
                        }}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        <Icons.XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Version Info */}
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    {version.approvedBy && (
                      <p className="text-green-600">✓ Approved by: {version.approvedBy}</p>
                    )}
                    {version.rejectedBy && (
                      <p className="text-red-600">✗ Rejected by: {version.rejectedBy}</p>
                    )}
                    {version.clientFeedback && (
                      <p className="text-orange-600 mt-1">Feedback: {version.clientFeedback}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
