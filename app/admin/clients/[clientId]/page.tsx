"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { Icons } from "@/components/icons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ClientDetailPageProps {
  params: {
    clientId: string
  }
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [client, setClient] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClient()
    fetchClientProjects()
  }, [params.clientId])

  const fetchClient = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/clients/${params.clientId}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        setClient(data.data)
      } else {
        setError(data.message || 'Failed to fetch client')
      }
    } catch (err) {
      setError('Failed to fetch client')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClientProjects = async () => {
    try {
      const response = await fetch(`/api/projects?clientId=${params.clientId}`)
      const data = await response.json()
      
      console.log('📊 Admin client projects response:', data)
      
      if (data.status === 'success') {
        // Handle the nested structure - projects are in data.data.projects
        const projects = data.data.projects || []
        console.log('📊 Projects found:', projects.length, projects)
        setProjects(projects)
      }
    } catch (err) {
      console.error('Failed to fetch client projects:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "active":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "approved":
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "revisions":
      case "revision":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "archived":
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
          <p className="text-muted-foreground">Loading client details...</p>
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
          <Button onClick={() => (window.location.href = "/admin/clients")}>
            <Icons.ArrowLeft />
            <span className="ml-2">Back to Clients</span>
          </Button>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icons.Users />
          <h3 className="text-lg font-medium text-foreground mb-2">Client not found</h3>
          <p className="text-muted-foreground mb-4">The client you're looking for doesn't exist.</p>
          <Button onClick={() => (window.location.href = "/admin/clients")}>
            <Icons.ArrowLeft />
            <span className="ml-2">Back to Clients</span>
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
              onClick={() => (window.location.href = "/admin/clients")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icons.ArrowLeft />
              <span className="ml-2">Back to Clients</span>
            </Button>
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/admin/projects/new")}
            >
              <Icons.Plus />
              <span className="ml-2">Create Project</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = `/admin/clients/${client.id}/edit`)}
            >
              <Icons.Edit />
              <span className="ml-2">Edit Client</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Client Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Icons.User />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
                <p className="text-muted-foreground">{client.company}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Information */}
            <div className="lg:col-span-1">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Client Information</CardTitle>
                  <CardDescription className="text-muted-foreground">Contact details and notes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="text-sm text-card-foreground">{client.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="text-sm text-card-foreground">{client.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Address</p>
                    <p className="text-sm text-card-foreground">{client.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last Activity</p>
                    <p className="text-sm text-card-foreground">{new Date(client.updatedAt).toLocaleDateString()}</p>
                  </div>
                  {client.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm text-card-foreground">{client.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Projects */}
            <div className="lg:col-span-2">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Projects</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {projects.length} project{projects.length !== 1 ? "s" : ""} total
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {console.log('📊 Rendering projects:', projects.length, projects)}
                  {projects.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                  <Icons.FolderOpen />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{project.title}</div>
                                  <div className="text-xs text-muted-foreground">#{project.id}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {project.description || "No description"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {new Date(project.createdAt).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => (window.location.href = `/admin/projects/${project.id}/files`)}
                              >
                                <Icons.Eye />
                                <span className="ml-2">View</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Icons.FolderOpen />
                      <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
                      <p className="text-muted-foreground mb-4">This client doesn't have any projects yet.</p>
                      <Button
                        onClick={() => (window.location.href = "/admin/projects/new")}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Icons.Plus />
                        <span className="ml-2">Create Project</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
