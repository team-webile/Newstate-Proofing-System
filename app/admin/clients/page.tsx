"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { useClients } from "@/lib/use-clients"
import { ClientsSkeleton } from "@/components/clients-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(10)
  const router = useRouter()
  const { data, loading, error, refreshClients } = useClients(currentPage, limit, searchTerm)
  const { toast } = useToast()

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Alert>
            <Icons.AlertCircle />
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={refreshClients}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const clients = data?.clients || []
  const pagination = data?.pagination

  const handleDeleteClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.status === 'success') {
        toast({
          title: "Client Deleted",
          description: "Client has been deleted successfully.",
        })
        await refreshClients()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete client",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-background mx-16 ">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/dashboard')}
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
      {loading ? (
        <div className="p-6">
          <div className="mb-8">
            <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="border rounded-lg">
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : <main className="p-6">
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
                  <TableHead className="w-[150px]">Notes</TableHead>
                  <TableHead className="w-[120px]">Projects</TableHead>
                  <TableHead className="w-[120px]">Last Activity</TableHead>
                  <TableHead className="w-[200px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icons.User />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{client.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-muted-foreground">{client.company || "N/A"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm text-foreground">{client.email}</div>
                        <div className="text-xs text-muted-foreground">{client.phone || "No phone"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-sm text-muted-foreground max-w-[150px] truncate cursor-help">
                              {client.notes || "No notes"}
                            </div>
                          </TooltipTrigger>
                          {client.notes && (
                            <TooltipContent>
                              <p className="max-w-xs">{client.notes}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground">
                        {client._count?.projects || 0} project{(client._count?.projects || 0) !== 1 ? "s" : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(client.updatedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/clients/${client.id}/edit`)}
                        >
                          <Icons.Edit />
                          <span className="ml-2">Edit</span>
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

        {clients.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Icons.Users />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No clients found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? "No clients match your search criteria." : "Get started by adding your first client."}
              </p>
              <Button
                onClick={() => router.push("/admin/clients/new")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Icons.Plus />
                <span className="ml-2">Add Your First Client</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <Card className="border-border bg-card mt-6">
            <CardContent className="flex items-center justify-between py-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} clients
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <Icons.ChevronLeft />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i
                    if (pageNum > pagination.totalPages) return null
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                  <Icons.ChevronRight />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>}
    </div>
  )
}
