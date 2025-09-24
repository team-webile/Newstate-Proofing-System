"use client"

import { useState } from "react"
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

interface Project {
  id: string
  name: string
  clientId: string
  description: string
  allowDownloads: boolean
  emailNotifications: boolean
  publicLink: string
  status: "draft" | "pending" | "approved" | "revisions"
}

export default function NewProjectPage() {
  const [project, setProject] = useState<Partial<Project>>({
    name: "",
    clientId: "",
    description: "",
    allowDownloads: true,
    emailNotifications: true,
    status: "draft",
  })

  // Mock clients data - will be replaced with real data
  const clients = [
    { id: "1", name: "Atlantic Wellness" },
    { id: "2", name: "Provectus Corp" },
    { id: "3", name: "Health Plus" },
    { id: "4", name: "Woody's Restaurant" },
  ]

  const generateProjectId = () => {
    return Math.floor(10000 + Math.random() * 90000).toString()
  }

  const generatePublicLink = (projectId: string, projectName: string) => {
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return `${window.location.origin}/review/${projectId}-${slug}`
  }

  const handleSaveProject = () => {
    if (!project.name || !project.clientId) {
      alert("Please fill in project name and select a client")
      return
    }

    const projectId = generateProjectId()
    const publicLink = generatePublicLink(projectId, project.name)
    
    const newProject: Project = {
      id: projectId,
      name: project.name,
      clientId: project.clientId,
      description: project.description || "",
      allowDownloads: project.allowDownloads ?? true,
      emailNotifications: project.emailNotifications ?? true,
      publicLink,
      status: "draft",
    }

    // Here you would typically save to your backend
    console.log("Saving project:", newProject)
    
    // Redirect to project file management page
    window.location.href = `/admin/projects/${projectId}/files`
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
              <span className="ml-2">Create Project</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create New Project</h1>
            <p className="text-muted-foreground">Create a new project. You'll be able to add files after creation.</p>
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
                    <Label htmlFor="projectName">Project Name *</Label>
                    <Input
                      id="projectName"
                      placeholder="Enter project name"
                      value={project.name}
                      onChange={(e) => setProject(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="client">Client *</Label>
                    <Select value={project.clientId} onValueChange={(value) => setProject(prev => ({ ...prev, clientId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
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
                      placeholder="Enter project description"
                      value={project.description}
                      onChange={(e) => setProject(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
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
                      <Label htmlFor="downloads">Allow Downloads</Label>
                      <p className="text-sm text-muted-foreground">Clients can download files</p>
                    </div>
                    <Switch
                      id="downloads"
                      checked={project.allowDownloads}
                      onCheckedChange={(checked) => setProject(prev => ({ ...prev, allowDownloads: checked }))}
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
                    <Label className="text-sm font-medium">Project Name</Label>
                    <p className="text-sm text-muted-foreground">
                      {project.name || "Enter project name"}
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
                    <p>1. Fill in project name and select client</p>
                    <p>2. Configure download and notification settings</p>
                    <p>3. Create project</p>
                    <p>4. Add files and assets to the project</p>
                    <p>5. Share link with client for review</p>
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