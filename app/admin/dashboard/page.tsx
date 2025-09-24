"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoutButton } from "@/components/logout-button"

export default function AdminDashboard() {
  // Mock data - will be replaced with real data later
  const stats = {
    totalClients: 24,
    totalProjects: 156,
    pendingProjects: 8,
    activeProjects: 12,
  }

  const recentProjects = [
    {
      id: "16994",
      name: "Atlantic Spa",
      client: "Atlantic Wellness",
      status: "pending",
      daysAgo: 2,
      thumbnail: "https://placehold.co/200x150/1e40af/ffffff?text=Atlantic+Spa",
    },
    {
      id: "18395",
      name: "Provectus",
      client: "Provectus Corp",
      status: "approved",
      daysAgo: 1,
      thumbnail: "https://placehold.co/200x150/059669/ffffff?text=Provectus",
    },
    {
      id: "18996",
      name: "Chiropractic",
      client: "Health Plus",
      status: "revisions",
      daysAgo: 3,
      thumbnail: "https://placehold.co/200x150/ea580c/ffffff?text=Chiropractic",
    },
    {
      id: "16997",
      name: "Woody's",
      client: "Woody's Restaurant",
      status: "pending",
      daysAgo: 1,
      thumbnail: "https://placehold.co/200x150/1e40af/ffffff?text=Woodys",
    },
  ]

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

  return (
    <div className="min-h-screen bg-background mx-16 ">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icons.Search />
              </div>
              <Input placeholder="Search projects..." className="w-64 pl-9 bg-input border-border" />
            </div>
            <ThemeToggle />
            <LogoutButton />
            <Button variant="ghost" size="sm">
              <Icons.Settings />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 mx-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage your client projects and proofing workflows</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">All Clients</CardTitle>
              <Icons.Users />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">All Projects</CardTitle>
              <Icons.FolderOpen />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">+12 from last month</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Pending Review</CardTitle>
              <Icons.Clock />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stats.pendingProjects}</div>
              <p className="text-xs text-muted-foreground">Awaiting client feedback</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Active Projects</CardTitle>
              <Icons.FolderOpen />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
              <CardDescription className="text-muted-foreground">Create new clients and projects</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => (window.location.href = "/admin/clients/new")}
              >
                <div className="mr-2">
                  <Icons.Plus />
                </div>
                Add New Client
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => (window.location.href = "/admin/projects/new")}
              >
                <div className="mr-2">
                  <Icons.Plus />
                </div>
                Add New Project
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">View All</CardTitle>
              <CardDescription className="text-muted-foreground">Browse and manage existing data</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-accent bg-transparent"
                onClick={() => (window.location.href = "/admin/clients")}
              >
                <div className="mr-2">
                  <Icons.Users />
                </div>
                All Clients
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-accent bg-transparent"
                onClick={() => (window.location.href = "/admin/projects")}
              >
                <div className="mr-2">
                  <Icons.FolderOpen />
                </div>
                All Projects
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card mb-8">
          <CardHeader>
            <CardTitle className="text-card-foreground">System Status</CardTitle>
            <CardDescription className="text-muted-foreground">Current system health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-card-foreground">All systems operational</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Last updated: 2 minutes ago</div>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Recent Projects</CardTitle>
            <CardDescription className="text-muted-foreground">
              Latest project activity and status updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-accent/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      <img
                        src={project.thumbnail || "/placeholder.svg"}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground">
                        {project.id} - {project.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{project.client}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                    <span className="text-sm text-muted-foreground">{project.daysAgo}d ago</span>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
