"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { Icons } from "@/components/icons";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { useProjects } from "@/lib/use-projects";
import { ProjectsSkeleton } from "@/components/projects-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ProjectsAPI } from "@/lib/projects-api";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
} from "@/components/ui/alert-dialog";

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [copiedProjectId, setCopiedProjectId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data, loading, error, refreshProjects } = useProjects(
    currentPage,
    itemsPerPage,
    searchTerm,
    statusFilter
  );
  const { toast } = useToast();

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
                onClick={refreshProjects}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const projects = data?.projects || [];
  const total = data?.total || 0;
  const statusCounts = data?.statusCounts || {
    all: 0,
    active: 0,
    archived: 0,
    completed: 0,
  };

  const totalPages = Math.ceil(total / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.status === "success") {
        toast({
          title: "Project Deleted",
          description: "Project has been deleted successfully.",
        });
        await refreshProjects();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete project.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete project error:", error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportProjects = async () => {
    try {
      setIsExporting(true);
      await ProjectsAPI.exportProjectsCSV(searchTerm, statusFilter);
      toast({
        title: "Export Successful",
        description: "Projects have been exported to CSV successfully.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "archived":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "approved":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "revisions":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "in-progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return (
          <div className="h-4 w-4">
            <Icons.Play />
          </div>
        );
      case "archived":
        return (
          <div className="h-4 w-4">
            <Icons.Archive />
          </div>
        );
      case "completed":
        return (
          <div className="h-4 w-4">
            <Icons.CheckCircle />
          </div>
        );
      case "pending":
        return (
          <div className="h-4 w-4">
            <Icons.Clock />
          </div>
        );
      case "approved":
        return (
          <div className="h-4 w-4">
            <Icons.CheckCircle />
          </div>
        );
      case "revisions":
        return (
          <div className="h-4 w-4">
            <Icons.AlertCircle />
          </div>
        );
      case "in-progress":
        return (
          <div className="h-4 w-4">
            <Icons.Play />
          </div>
        );
      default:
        return (
          <div className="h-4 w-4">
            <Icons.FolderOpen />
          </div>
        );
    }
  };

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
            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportProjects}
              disabled={isExporting}
              className="bg-transparent"
            >
              <Icons.Download />
              <span className="ml-2">
                {isExporting ? "Exporting..." : "Export"}
              </span>
            </Button>

            {/* Search Field */}
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
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                <SelectItem value="active">
                  Active ({statusCounts.active})
                </SelectItem>
                <SelectItem value="archived">
                  Archived ({statusCounts.archived})
                </SelectItem>
                <SelectItem value="completed">
                  Completed ({statusCounts.completed})
                </SelectItem>
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
      {loading && <ProjectsSkeleton />}
      {!loading && (
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                All Projects
              </h1>
              <p className="text-muted-foreground">
                Manage your client projects and track their progress
              </p>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="border-border bg-card hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(project.status)}
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.charAt(0).toUpperCase() +
                            project.status.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            (window.location.href = `/admin/projects/${project.id}/edit`)
                          }
                          title="Edit Project"
                        >
                          <div className="h-4 w-4">
                            <Icons.Edit />
                          </div>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              title="Delete Project"
                            >
                              <div className="h-4 w-4">
                                <Icons.Trash />
                              </div>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Project
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{project.title}
                                "? This action cannot be undone.
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
                    {/* Project Info */}
                    <div>
                      <CardTitle className="text-lg text-card-foreground mb-1">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground mb-2">
                        {project.description}
                      </CardDescription>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icons.User />
                        <span>{project.clientFirstName} {project.clientLastName}</span>

                        <span>•</span>
                        <span>
                          {project.lastActivity
                            ? format(
                                new Date(project.lastActivity),
                                "dd MMM yyyy, hh:mm a"
                              )
                            : "Unknown"}
                        </span>
                      </div>
                    </div>

                    {/* Project Stats */}

                    {/* Project Settings */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <div
                          className={`h-4 w-4 ${
                            project.downloadEnabled
                              ? "text-green-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          <Icons.Download />
                        </div>
                        <span className="text-muted-foreground">Downloads</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-4 w-4 text-muted-foreground">
                          <Icons.Mail />
                        </div>
                        <span className="text-muted-foreground">
                          Notifications
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() =>
                          (window.location.href = `/admin/projects/${project.id}/files`)
                        }
                        title="Manage Project Files"
                      >
                        <div className="h-4 w-4 mr-2">
                          <Icons.FolderOpen />
                        </div>
                        Manage Files
                      </Button>
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const publicLink = `${window.location.origin}/client/${project.clientId}?project=${project.id}`;
                          window.open(publicLink, "_blank");
                        }}
                        title="Open Public Link"
                      >
                        <Icons.ExternalLink />
                      </Button> */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const publicLink = `${window.location.origin}/client/${project.clientId}?project=${project.id}`;
                          try {
                            await navigator.clipboard.writeText(publicLink);
                            setCopiedProjectId(project.id);
                            setTimeout(() => setCopiedProjectId(null), 2000);
                            toast({
                              title: "Link Copied",
                              description:
                                "Public link has been copied to clipboard.",
                            });
                          } catch (error) {
                            console.error("Failed to copy:", error);
                            toast({
                              title: "Error",
                              description:
                                "Failed to copy link. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                        title="Copy Public Link"
                        className={
                          copiedProjectId === project.id
                            ? "bg-green-100 text-green-700 border-green-300"
                            : ""
                        }
                      >
                        {copiedProjectId === project.id ? (
                          <>
                            <div className="h-4 w-4 mr-1 flex items-center">
                              <Icons.CheckCircle />
                            </div>
                            Copied
                          </>
                        ) : (
                          <Icons.Copy />
                        )}
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
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
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
                      );
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {/* Results info */}
            {projects.length > 0 && (
              <div className="text-center mt-4 text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, projects.length)}{" "}
                of {total} projects
              </div>
            )}

            {projects.length === 0 && (
              <Card className="border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Icons.FolderOpen />
                  <h3 className="text-lg font-medium text-card-foreground mb-2">
                    No projects found
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || statusFilter !== "all"
                      ? "No projects match your search criteria."
                      : "Get started by creating your first project."}
                  </p>
                  <Button
                    onClick={() =>
                      (window.location.href = "/admin/projects/new")
                    }
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
      )}
    </div>
  );
}
