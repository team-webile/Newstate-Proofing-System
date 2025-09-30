"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Client {
  id: string
  name: string
  email: string
  company?: string
}

interface Project {
  title: string
  description?: string
  clientId: string
  downloadEnabled: boolean
  status?: string
  emailNotifications?: boolean
}

export default function NewProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const [project, setProject] = useState<Project>({
    title: "",
    description: "",
    clientId: "",
    downloadEnabled: true,
    status: "active",
    emailNotifications: true,
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/clients')
      const data = await response.json()
      
      if (data.status === 'success') {
        setClients(data.data.clients || [])
      } else {
        setError(data.message || 'Failed to fetch clients')
      }
    } catch (err) {
      setError('Failed to fetch clients')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form submitted with project data:', project)
    
    if (!project.title || !project.clientId) {
      console.log('Validation failed:', { title: project.title, clientId: project.clientId })
      toast({
        title: "Validation Error",
        description: "Project title and client are required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)
      
      console.log('Sending request to /api/projects with data:', project)
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      
      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.status === 'success') {
        toast({
          title: "Project Created",
          description: "Project has been created successfully.",
        })
        router.push('/admin/projects')
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create project",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Request error:', error)
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProject(prev => ({
      ...prev,
      [name]: value
    }))
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Create New Project</h1>
              <p className="text-muted-foreground">Create a new project. You'll be able to add files after creation.</p>
            </div>
            <Button
              type="submit"
              form="project-form"
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? (
                <>
                  <Icons.Loader2 />
                  Creating...
                </>
              ) : (
                <>
                  <Icons.Save />
                  <span className="ml-2">Create Project</span>
                </>
              )}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icons.Loader2 />
              <span className="ml-2">Loading clients...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Icons.AlertCircle />
              <h3 className="text-lg font-medium text-foreground mb-2">Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchClients}>
                Try Again
              </Button>
            </div>
          ) : (
            <form id="project-form" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Project Information</CardTitle>
                        <CardDescription>Basic details about the project</CardDescription>
                      </div>
                     
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="title">Project Title *</Label>
                        <Input
                          id="title"
                          name="title"
                          placeholder="Enter project title"
                          value={project.title}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="clientId">Client *</Label>
                        <Select 
                          value={project.clientId} 
                          onValueChange={(value) => setProject(prev => ({ ...prev, clientId: value }))}
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
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Enter project description"
                          value={project.description}
                          onChange={handleInputChange}
                          rows={4}
                        />
                      </div>

                      <div>
                        <Label htmlFor="status">Project Status</Label>
                        <Select 
                          value={project.status || "active"} 
                          onValueChange={(value) => setProject(prev => ({ ...prev, status: value }))}
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
                </div>

                {/* Project Settings */}
                <div className="space-y-6">
                  {/* Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Settings</CardTitle>
                      <CardDescription>Configure project options</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="downloadEnabled">Allow Downloads</Label>
                          <p className="text-sm text-muted-foreground">Clients can download files</p>
                        </div>
                        <Switch
                          id="downloadEnabled"
                          checked={project.downloadEnabled}
                          onCheckedChange={(checked) => setProject(prev => ({ ...prev, downloadEnabled: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="emailNotifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Send email updates to client</p>
                        </div>
                        <Switch
                          id="emailNotifications"
                          checked={project.emailNotifications}
                          onCheckedChange={(checked) => setProject(prev => ({ ...prev, emailNotifications: checked }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Preview</CardTitle>
                      <CardDescription>Preview of the project</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Project Title</Label>
                        <p className="text-sm text-muted-foreground">
                          {project.title || "Enter project title"}
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Client</Label>
                        <p className="text-sm text-muted-foreground">
                          {clients.find(c => c.id === project.clientId)?.name || "Select client"}
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <Badge variant="secondary">Draft</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Next Steps */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Next Steps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>1. Fill in project title and select client</p>
                        <p>2. Configure download settings</p>
                        <p>3. Create project</p>
                        <p>4. Add files and assets to the project</p>
                        <p>5. Share link with client for review</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}