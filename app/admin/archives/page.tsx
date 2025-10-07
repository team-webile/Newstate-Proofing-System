'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Archive, ArrowLeft, Eye, Edit, Mail, Calendar, MoreHorizontal, Search, Plus, ArchiveX } from "lucide-react"
import LogoImage from "@/components/LogoImage"
import toast from 'react-hot-toast'

interface Project {
  id: number
  projectNumber: string
  name: string
  description: string
  clientEmail: string
  downloadEnabled: boolean
  archived: boolean
  createdAt: string
  updatedAt: string
  reviews: any[]
}

export default function ArchivesPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [showArchived])

  useEffect(() => {
    filterProjects()
  }, [projects, searchQuery])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects?archived=${showArchived}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterProjects = () => {
    let filtered = projects

    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredProjects(filtered)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const toggleArchiveStatus = async (projectId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: !currentStatus }),
      })

      if (response.ok) {
        // Reload projects to reflect changes
        await loadProjects()
        
        // Show success toast
        if (currentStatus) {
          toast.success('Project unarchived successfully!')
        } else {
          toast.success('Project archived successfully!')
        }
      } else {
        console.error('Failed to update project archive status')
        toast.error('Failed to update project status')
      }
    } catch (error) {
      console.error('Error updating project archive status:', error)
      toast.error('Failed to update project status')
    }
  }

  // Load all projects for stats (separate from filtered view)
  const [allProjects, setAllProjects] = useState<Project[]>([])
  
  useEffect(() => {
    const loadAllProjectsForStats = async () => {
      try {
        const [archivedResponse, activeResponse] = await Promise.all([
          fetch('/api/projects?archived=true'),
          fetch('/api/projects?archived=false')
        ])
        
        if (archivedResponse.ok && activeResponse.ok) {
          const [archivedProjects, activeProjects] = await Promise.all([
            archivedResponse.json(),
            activeResponse.json()
          ])
          
          setAllProjects([...archivedProjects, ...activeProjects])
        }
      } catch (error) {
        console.error('Error loading all projects for stats:', error)
      }
    }
    
    loadAllProjectsForStats()
  }, [projects]) // Reload when projects change

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        {/* Header */}
        <header className="border-b border-neutral-800 bg-black">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <Link href="/admin/dashboard">
                <LogoImage 
                  width={200}
                  height={60}
                  className="h-8 sm:h-10 lg:h-12 w-auto"
                />
              </Link>

              <nav className="hidden lg:flex items-center gap-6 text-sm">
                <Link href="/admin/dashboard" className="text-neutral-400 hover:text-brand-yellow transition-colors">
                  DASHBOARD
                </Link>
                <span className="text-neutral-600">|</span>
                <Link href="/admin/new-project" className="text-neutral-400 hover:text-brand-yellow transition-colors">
                  ADD NEW PROJECT
                </Link>
                <span className="text-neutral-600">|</span>
                <Link href="/admin/archives" className="text-white hover:text-brand-yellow transition-colors">
                  PROJECT ARCHIVES
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Loading State */}
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Link
              href="/admin/dashboard"
              className="p-2 bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors border border-neutral-800"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <Archive className="w-6 h-6 sm:w-8 sm:h-8 text-brand-yellow" />
                Project Archives
              </h1>
              <p className="text-sm sm:text-base text-neutral-400 mt-1">Loading archived projects...</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-white mx-auto"></div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-neutral-300">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-black">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard">
              <LogoImage 
                width={200}
                height={60}
                className="h-8 sm:h-10 lg:h-12 w-auto"
              />
            </Link>

            <nav className="hidden lg:flex items-center gap-6 text-sm">
              <Link href="/admin/dashboard" className="text-neutral-400 hover:text-brand-yellow transition-colors">
                DASHBOARD
              </Link>
              <span className="text-neutral-600">|</span>
              <Link href="/admin/new-project" className="text-neutral-400 hover:text-brand-yellow transition-colors">
                ADD NEW PROJECT
              </Link>
              <span className="text-neutral-600">|</span>
              <Link href="/admin/archives" className="text-white hover:text-brand-yellow transition-colors">
                PROJECT ARCHIVES
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Page Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link
            href="/admin/dashboard"
            className="p-2 bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors border border-neutral-800"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
              <Archive className="w-6 h-6 sm:w-8 sm:h-8 text-brand-yellow" />
              <span className="hidden sm:inline">Project Archives</span>
              <span className="sm:hidden">Archives</span>
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 mt-1">
              {showArchived ? 'Archived' : 'Active'} projects ({filteredProjects.length})
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-neutral-900 border-neutral-700 text-white placeholder-neutral-400 w-full sm:w-64 focus:border-brand-yellow focus:ring-brand-yellow/20 text-sm sm:text-base"
                />
              </div>
              
              <Button
                variant={showArchived ? "default" : "outline"}
                onClick={() => setShowArchived(!showArchived)}
                className={`w-full sm:w-auto text-sm sm:text-base ${showArchived ? "bg-brand-yellow hover:bg-brand-yellow/90 text-black" : "border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-brand-yellow bg-neutral-900"}`}
              >
                <Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                {showArchived ? 'Show Active' : 'Show Archived'}
              </Button>
            </div>

            
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProjects.map((project) => (
              <Card key={project.id} className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 hover:shadow-lg hover:shadow-brand-yellow/10 transition-all duration-300 group">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white text-base sm:text-lg group-hover:text-brand-yellow transition-colors truncate">{project.name}</CardTitle>
                      <CardDescription className="text-neutral-400 font-mono text-xs sm:text-sm truncate">{project.projectNumber}</CardDescription>
          </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-neutral-400 hover:text-brand-yellow hover:bg-neutral-800">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-neutral-900 border-neutral-700">
                        <DropdownMenuItem 
                          onClick={() => router.push(`/admin/project/${project.id}`)}
                          className="text-neutral-300 hover:bg-neutral-800 hover:text-brand-yellow focus:bg-neutral-800 focus:text-brand-yellow"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => router.push(`/admin/project/${project.id}/edit`)}
                          className="text-neutral-300 hover:bg-neutral-800 hover:text-brand-yellow focus:bg-neutral-800 focus:text-brand-yellow"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => toggleArchiveStatus(project.id, project.archived)}
                          className="text-neutral-300 hover:bg-neutral-800 hover:text-brand-yellow focus:bg-neutral-800 focus:text-brand-yellow"
                        >
                          {project.archived ? (
                            <>
                              <ArchiveX className="h-4 w-4 mr-2" />
                              Unarchive Project
                            </>
                          ) : (
                            <>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive Project
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <p className="text-neutral-300 text-xs sm:text-sm line-clamp-2 leading-relaxed">{project.description}</p>

                  <div className="flex items-center space-x-2 text-neutral-400 text-xs sm:text-sm">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-yellow/70 flex-shrink-0" />
                    <span className="truncate">{project.clientEmail}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-neutral-400 text-xs sm:text-sm">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-yellow/70 flex-shrink-0" />
                    <span className="truncate">Created {formatDate(project.createdAt)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs sm:text-sm ${project.archived ? "border-neutral-600 text-neutral-400" : "border-green-500 text-green-400 bg-green-500/10"}`}
                      >
                        {project.archived ? 'Archived' : 'Active'}
                      </Badge>
                      {project.downloadEnabled && (
                        <Badge variant="outline" className="border-brand-yellow text-brand-yellow bg-brand-yellow/10 text-xs sm:text-sm">
                          Download
                        </Badge>
                      )}
                    </div>
                </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1 sm:pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/admin/project/${project.id}`)}
                      className="flex-1 border-neutral-600 text-neutral-300 hover:bg-brand-yellow hover:text-black hover:border-brand-yellow transition-colors bg-neutral-900 text-xs sm:text-sm"
                    >
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/admin/project/${project.id}/edit`)}
                      className="flex-1 border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-brand-yellow hover:border-brand-yellow transition-colors bg-neutral-900 text-xs sm:text-sm"
                    >
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleArchiveStatus(project.id, project.archived)}
                      className={`flex-1 transition-colors text-xs sm:text-sm ${
                        project.archived 
                          ? "border-green-600 text-green-400 hover:bg-green-600 hover:text-white bg-neutral-900" 
                          : "border-neutral-600 text-neutral-400 hover:bg-neutral-600 hover:text-white bg-neutral-900"
                      }`}
                    >
                      {project.archived ? (
                        <>
                          <ArchiveX className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          <span className="hidden sm:inline">Unarchive</span>
                          <span className="sm:hidden">Restore</span>
                        </>
                      ) : (
                        <>
                          <Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          Archive
                        </>
                      )}
                    </Button>
              </div>
                </CardContent>
              </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-8 sm:py-12 lg:py-16">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 max-w-md mx-auto">
              <Archive className="h-12 w-12 sm:h-16 sm:w-16 text-brand-yellow mx-auto mb-4 sm:mb-6" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                {showArchived ? 'No archived projects' : 'No active projects'}
              </h3>
              <p className="text-sm sm:text-base text-neutral-400 mb-4 sm:mb-6 leading-relaxed px-2">
                {showArchived 
                  ? 'Projects you archive will appear here for future reference'
                  : 'Active projects will appear here for ongoing work'
                }
              </p>
              <Button 
                onClick={() => router.push('/admin/new-project')}
                className="bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold px-4 sm:px-6 py-2 text-sm sm:text-base w-full sm:w-auto"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                Create New Project
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

