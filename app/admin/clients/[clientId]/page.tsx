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

  // Mock data - will be replaced with real data fetching
  const mockClients = {
    "1": {
      id: "1",
      name: "Atlantic Wellness",
      email: "contact@atlanticwellness.com",
      phone: "+1 (555) 123-4567",
      company: "Atlantic Wellness",
      address: "123 Ocean Drive, Miami, FL 33139",
      notes: "Premium wellness center focusing on holistic health approaches.",
      projectsCount: 3,
      activeProjects: 1,
      lastActivity: "2 days ago",
      projects: [
        { id: "16994", name: "Atlantic Spa", status: "pending", description: "Complete spa branding package", createdAt: "2024-01-15" },
        { id: "17001", name: "Wellness Center", status: "approved", description: "Wellness center interior design", createdAt: "2024-01-10" },
        { id: "17002", name: "Therapy Rooms", status: "revisions", description: "Therapy room signage and branding", createdAt: "2024-01-20" },
      ],
    },
    "2": {
      id: "2",
      name: "Provectus Corp",
      email: "info@provectus.com",
      phone: "+1 (555) 987-6543",
      company: "Provectus Corp",
      address: "456 Business Blvd, New York, NY 10001",
      notes: "Technology consulting firm specializing in digital transformation.",
      projectsCount: 2,
      activeProjects: 1,
      lastActivity: "1 day ago",
      projects: [
        { id: "18395", name: "Provectus", status: "approved", description: "Corporate identity and branding", createdAt: "2024-01-12" },
        { id: "18400", name: "Corporate Branding", status: "pending", description: "Complete corporate rebrand", createdAt: "2024-01-18" },
      ],
    },
    "3": {
      id: "3",
      name: "Health Plus",
      email: "admin@healthplus.com",
      phone: "+1 (555) 456-7890",
      company: "Health Plus",
      address: "789 Medical Center Dr, Chicago, IL 60601",
      notes: "Multi-specialty healthcare provider with focus on preventive care.",
      projectsCount: 1,
      activeProjects: 1,
      lastActivity: "3 days ago",
      projects: [
        { id: "18996", name: "Chiropractic", status: "revisions", description: "Chiropractic clinic branding", createdAt: "2024-01-22" },
      ],
    },
    "4": {
      id: "4",
      name: "Woody's Restaurant",
      email: "manager@woodys.com",
      phone: "+1 (555) 321-0987",
      company: "Woody's Restaurant",
      address: "321 Food Street, Austin, TX 78701",
      notes: "Family-owned restaurant serving authentic American cuisine since 1985.",
      projectsCount: 1,
      activeProjects: 1,
      lastActivity: "1 day ago",
      projects: [
        { id: "16997", name: "Woody's", status: "pending", description: "Restaurant branding and menu design", createdAt: "2024-01-25" },
      ],
    },
  }

  useEffect(() => {
    // Simulate loading client data
    setTimeout(() => {
      const clientData = mockClients[params.clientId as keyof typeof mockClients]
      if (clientData) {
        setClient(clientData)
      }
      setIsLoading(false)
    }, 500)
  }, [params.clientId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "approved":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "revisions":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
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

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icons.Users className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
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
                <Icons.User className="h-8 w-8 text-primary" />
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
                    <p className="text-sm text-card-foreground">{client.lastActivity}</p>
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
                    {client.projectsCount} project{client.projectsCount !== 1 ? "s" : ""} total
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
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
                      {client.projects.map((project: any) => (
                        <TableRow key={project.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                <Icons.FolderOpen className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{project.name}</div>
                                <div className="text-xs text-muted-foreground">#{project.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">{project.description}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">{project.createdAt}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              <Icons.Eye />
                              <span className="ml-2">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
