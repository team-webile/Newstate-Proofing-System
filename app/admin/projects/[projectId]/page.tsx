"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ProjectDetailPageProps {
  params: {
    projectId: string
  }
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProject()
  }, [params.projectId])

  const fetchProject = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/projects/${params.projectId}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        setProject(data.data)
      } else {
        setError(data.message || 'Failed to fetch project')
      }
    } catch (err) {
      setError('Failed to fetch project')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "COMPLETED":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "ARCHIVED":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icons.Loader2 />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icons.AlertCircle />
          <h3 className="text-lg font-medium text-foreground mb-2">Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => (window.location.href = "/admin/projects")}>
            <Icons.ArrowLeft />
            <span className="ml-2">Back to Projects</span>
          </Button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icons.FolderOpen />
          <h3 className="text-lg font-medium text-foreground mb-2">Project not found</h3>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => (window.location.href = "/admin/projects")}>
            <Icons.ArrowLeft />
            <span className="ml-2">Back to Projects</span>
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
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icons.ArrowLeft />
              <span className="ml-2">Back</span>
            </Button>
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => (window.location.href = `/admin/projects/${project.id}/edit`)}
            >
              <Icons.Edit />
              <span className="ml-2">Edit Project</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Project Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Icons.FolderOpen />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
                <p className="text-muted-foreground">
                  {project.client?.firstName} {project.client?.lastName} {project.client?.company && `(${project.client.company})`}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Information */}
            <div className="lg:col-span-1">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Project Information</CardTitle>
                  <CardDescription className="text-muted-foreground">Project details and settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Client</p>
                    <p className="text-sm text-card-foreground">{project.client?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Created</p>
                    <p className="text-sm text-card-foreground">{new Date(project.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                    <p className="text-sm text-card-foreground">{new Date(project.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Downloads</p>
                    <p className="text-sm text-card-foreground">
                      {project.downloadEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  {project.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-card-foreground">{project.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Project Files/Reviews */}
            <div className="lg:col-span-2">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Project Files</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Files and assets for this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Icons.FolderOpen />
                    <h3 className="text-lg font-medium text-foreground mb-2">No files yet</h3>
                    <p className="text-muted-foreground mb-4">This project doesn't have any files yet.</p>
                    <Button
                      onClick={() => (window.location.href = `/admin/projects/${project.id}/files`)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Icons.Plus />
                      <span className="ml-2">Add Files</span>
                    </Button>
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
