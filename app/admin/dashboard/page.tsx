"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { LogoutButton } from "@/components/logout-button"
import { useDashboardData } from "@/lib/use-dashboard-data"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

export default function AdminDashboard() {
  const { data, loading, error, refreshData } = useDashboardData()
  const { toast } = useToast()
 
  if (error) {
    return (
      <div className="min-h-screen bg-background mx-16 flex items-center justify-center">
        <div className="text-center">
          <Alert>
            <Icons.AlertCircle />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4"
                onClick={refreshData}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Use real data or fallback to empty state
  const stats = data?.stats || {
    totalClients: 0,
    totalProjects: 0,
    pendingProjects: 0,
    activeProjects: 0,
  }

  const recentProjects = data?.recentProjects || []
  const systemStatus = data?.systemStatus

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
             
            <Button 
              variant="ghost" 
              size="sm"
              onClick={refreshData}
              disabled={loading}
            >
              <Icons.Refresh />
            </Button>
            <LogoutButton />
             
          </div>
        </div>
      </header>
   {loading && <DashboardSkeleton />}
   {!loading && (
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
              <div className={`h-2 w-2 rounded-full ${
                systemStatus?.status === 'operational' ? 'bg-green-500' :
                systemStatus?.status === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>
              <span className="text-sm text-card-foreground">
                {systemStatus?.message || 'Checking system status...'}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Last updated: {systemStatus?.lastUpdated ? 
                new Date(systemStatus.lastUpdated).toLocaleString() : 
                'Unknown'
              }
            </div>
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
            {recentProjects.length > 0 ? (
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
                          {project.name}
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
            ) : (
              <div className="text-center py-8">
                 <p className="text-muted-foreground mb-2">No projects found</p>
                <Button 
                  onClick={() => (window.location.href = "/admin/projects/new")}
                >
                  Create Your First Project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      )}
    </div>
  )
}
