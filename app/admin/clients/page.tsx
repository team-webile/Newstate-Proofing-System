"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  // Mock data - will be replaced with real data later
  const [clients, setClients] = useState([
    {
      id: "1",
      name: "Atlantic Wellness",
      email: "contact@atlanticwellness.com",
      phone: "+1 (555) 123-4567",
      company: "Atlantic Wellness",
      projectsCount: 3,
      activeProjects: 1,
      lastActivity: "2 days ago",
      projects: [
        { id: "16994", name: "Atlantic Spa", status: "pending" },
        { id: "17001", name: "Wellness Center", status: "approved" },
        { id: "17002", name: "Therapy Rooms", status: "revisions" },
      ],
    },
    {
      id: "2",
      name: "Provectus Corp",
      email: "info@provectus.com",
      phone: "+1 (555) 987-6543",
      company: "Provectus Corp",
      projectsCount: 2,
      activeProjects: 1,
      lastActivity: "1 day ago",
      projects: [
        { id: "18395", name: "Provectus", status: "approved" },
        { id: "18400", name: "Corporate Branding", status: "pending" },
      ],
    },
    {
      id: "3",
      name: "Health Plus",
      email: "admin@healthplus.com",
      phone: "+1 (555) 456-7890",
      company: "Health Plus",
      projectsCount: 1,
      activeProjects: 1,
      lastActivity: "3 days ago",
      projects: [{ id: "18996", name: "Chiropractic", status: "revisions" }],
    },
    {
      id: "4",
      name: "Woody's Restaurant",
      email: "manager@woodys.com",
      phone: "+1 (555) 321-0987",
      company: "Woody's Restaurant",
      projectsCount: 1,
      activeProjects: 1,
      lastActivity: "1 day ago",
      projects: [{ id: "16997", name: "Woody's", status: "pending" }],
    },
  ])

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteClient = (clientId: string) => {
    setClients(clients.filter((client) => client.id !== clientId))
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
              onClick={() => window.history.back()}
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
                placeholder="Search clients..."
                className="w-64 pl-9 bg-input border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={() => (window.location.href = "/admin/clients/new")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Icons.Plus />
              <span className="ml-2">Add Client</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Clients</h1>
          <p className="text-muted-foreground">Manage your client profiles</p>
        </div>

        {/* Clients Table */}
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Client</TableHead>
                  <TableHead className="w-[200px]">Company</TableHead>
                  <TableHead className="w-[200px]">Contact</TableHead>
                  <TableHead className="w-[120px]">Projects</TableHead>
                  <TableHead className="w-[120px]">Last Activity</TableHead>
                  <TableHead className="w-[200px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icons.User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{client.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-muted-foreground">{client.company}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm text-foreground">{client.email}</div>
                        <div className="text-xs text-muted-foreground">{client.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground">
                        {client.projectsCount} project{client.projectsCount !== 1 ? "s" : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">{client.lastActivity}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => (window.location.href = `/admin/clients/${client.id}`)}
                        >
                          <Icons.Eye />
                          <span className="ml-2">View</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => (window.location.href = `/admin/clients/${client.id}/edit`)}
                        >
                          <Icons.Edit />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Icons.Trash />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Client</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {client.name}? This action cannot be undone and will also
                                delete all associated projects.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteClient(client.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filteredClients.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Icons.Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No clients found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? "No clients match your search criteria." : "Get started by adding your first client."}
              </p>
              <Button
                onClick={() => (window.location.href = "/admin/clients/new")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Icons.Plus />
                <span className="ml-2">Add Your First Client</span>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
