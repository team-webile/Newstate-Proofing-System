"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoutButton } from "@/components/logout-button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
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

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(4) // Show 6 projects per page

  // Mock data - will be replaced with real data later
  const [projects, setProjects] = useState([
    {
      id: "16994",
      name: "Atlantic Spa",
      client: "Atlantic Wellness",
      clientId: "1",
      status: "pending",
      createdDate: "2024-01-15",
      lastActivity: "2 days ago",
      filesCount: 12,
      thumbnail: "https://placehold.co/200x150/1e40af/ffffff?text=Atlantic+Spa",
      description: "Spa branding and interior design concepts",
      publicLink: "http://localhost:3000/review/16994-atlantic-spa",
      allowDownloads: true,
      emailNotifications: true,
    },
    {
      id: "18395",
      name: "Provectus",
      client: "Provectus Corp",
      clientId: "2",
      status: "approved",
      createdDate: "2024-01-20",
      lastActivity: "1 day ago",
      filesCount: 8,
      thumbnail: "https://placehold.co/200x150/059669/ffffff?text=Provectus",
      description: "Corporate identity and website redesign",
      publicLink: "http://localhost:3000/review/18395-provectus",
      allowDownloads: false,
      emailNotifications: true,
    },
    {
      id: "18996",
      name: "Chiropractic",
      client: "Health Plus",
      clientId: "3",
      status: "revisions",
      createdDate: "2024-01-10",
      lastActivity: "3 days ago",
      filesCount: 15,
      thumbnail: "https://placehold.co/200x150/ea580c/ffffff?text=Chiropractic",
      description: "Medical practice branding and signage",
      publicLink: "http://localhost:3000/review/18996-chiropractic",
      allowDownloads: true,
      emailNotifications: false,
    },
    {
      id: "16997",
      name: "Woody's",
      client: "Woody's Restaurant",
      clientId: "4",
      status: "pending",
      createdDate: "2024-01-22",
      lastActivity: "1 day ago",
      filesCount: 6,
      thumbnail: "https://placehold.co/200x150/1e40af/ffffff?text=Woodys",
      description: "Restaurant menu design and promotional materials",
      publicLink: "http://localhost:3000/review/16997-woodys",
      allowDownloads: true,
      emailNotifications: true,
    },
    {
      id: "17001",
      name: "Wellness Center",
      client: "Atlantic Wellness",
      clientId: "1",
      status: "approved",
      createdDate: "2024-01-18",
      lastActivity: "4 days ago",
      filesCount: 10,
      thumbnail: "https://placehold.co/200x150/059669/ffffff?text=Wellness",
      description: "Wellness center brochures and digital assets",
      publicLink: "http://localhost:3000/review/17001-wellness",
      allowDownloads: false,
      emailNotifications: true,
    },
    {
      id: "17002",
      name: "Therapy Rooms",
      client: "Atlantic Wellness",
      clientId: "1",
      status: "in-progress",
      createdDate: "2024-01-25",
      lastActivity: "5 hours ago",
      filesCount: 4,
      thumbnail: "https://placehold.co/200x150/6366f1/ffffff?text=Therapy",
      description: "Interior design concepts for therapy rooms",
      publicLink: "http://localhost:3000/review/17002-therapy",
      allowDownloads: true,
      emailNotifications: true,
    },
  ])

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || project.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter((project) => project.id !== projectId))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "approved":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "revisions":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "in-progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <div className="h-4 w-4"><Icons.Clock /></div>
      case "approved":
        return <div className="h-4 w-4"><Icons.CheckCircle /></div>
      case "revisions":
        return <div className="h-4 w-4"><Icons.AlertCircle /></div>
      case "in-progress":
        return <div className="h-4 w-4"><Icons.Play /></div>
      default:
        return <div className="h-4 w-4"><Icons.FolderOpen /></div>
    }
  }

  const statusCounts = {
    all: projects.length,
    pending: projects.filter((p) => p.status === "pending").length,
    approved: projects.filter((p) => p.status === "approved").length,
    revisions: projects.filter((p) => p.status === "revisions").length,
    "in-progress": projects.filter((p) => p.status === "in-progress").length,
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
              onClick={() => (window.location.href = "/admin/dashboard")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icons.ArrowLeft />
              <span className="ml-2">Back to Dashboard</span>
            </Button>
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icons.Search />
              </div>
              <Input
                placeholder="Search projects..."
                className="w-64 pl-9 bg-input border-border"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
                <SelectItem value="in-progress">In Progress ({statusCounts["in-progress"]})</SelectItem>
                <SelectItem value="revisions">Revisions ({statusCounts.revisions})</SelectItem>
                <SelectItem value="approved">Approved ({statusCounts.approved})</SelectItem>
              </SelectContent>
            </Select>
            <ThemeToggle />
            <LogoutButton />
            <Button
              onClick={() => (window.location.href = "/admin/projects/new")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Icons.Plus />
              <span className="ml-2">Add Project</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">All Projects</h1>
            <p className="text-muted-foreground">Manage your client projects and track their progress</p>
          </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProjects.map((project) => (
            <Card key={project.id} className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(project.status)}
                    <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => (window.location.href = `/admin/projects/${project.id}/edit`)}
                    >
                      <div className="h-4 w-4"><Icons.Edit /></div>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <div className="h-4 w-4"><Icons.Trash /></div>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{project.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProject(project.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project Thumbnail */}
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={project.thumbnail || "/placeholder.svg"}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Project Info */}
                <div>
                  <CardTitle className="text-lg text-card-foreground mb-1">
                    {project.id} - {project.name}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mb-2">{project.description}</CardDescription>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4"><Icons.User /></div>
                    <span>{project.client}</span>
                  </div>
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Files</p>
                    <p className="font-medium text-card-foreground">{project.filesCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Activity</p>
                    <p className="font-medium text-card-foreground">{project.lastActivity}</p>
                  </div>
                </div>

                {/* Project Settings */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <div className={`h-4 w-4 ${project.allowDownloads ? "text-green-500" : "text-muted-foreground"}`}>
                      <Icons.Download />
                    </div>
                    <span className="text-muted-foreground">Downloads</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`h-4 w-4 ${project.emailNotifications ? "text-green-500" : "text-muted-foreground"}`}>
                      <Icons.Mail />
                    </div>
                    <span className="text-muted-foreground">Notifications</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => window.location.href = `/admin/projects/${project.id}/files`}
                  >
                    <div className="h-4 w-4 mr-2"><Icons.FolderOpen /></div>
                    Manage Files
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(project.publicLink, "_blank")}
                  >
                    <div className="h-4 w-4"><Icons.ExternalLink /></div>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(project.publicLink)}>
                    <div className="h-4 w-4"><Icons.Copy /></div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {/* Show page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber
                  if (totalPages <= 5) {
                    pageNumber = i + 1
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i
                  } else {
                    pageNumber = currentPage - 2 + i
                  }
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Results info */}
        {filteredProjects.length > 0 && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredProjects.length)} of {filteredProjects.length} projects
          </div>
        )}

        {filteredProjects.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 text-muted-foreground mb-4"><Icons.FolderOpen /></div>
              <h3 className="text-lg font-medium text-card-foreground mb-2">No projects found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "No projects match your search criteria."
                  : "Get started by creating your first project."}
              </p>
              <Button
                onClick={() => (window.location.href = "/admin/projects/new")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Icons.Plus />
                <span className="ml-2">Create Your First Project</span>
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
      </main>
    </div>
  )
}
