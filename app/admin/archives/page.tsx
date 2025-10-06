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
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/admin/dashboard">
                <LogoImage 
                  width={200}
                  height={60}
                  className="h-12 w-auto"
                />
              </Link>

              <nav className="flex items-center gap-6 text-sm">
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
        <main className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/admin/dashboard"
              className="p-2 bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors border border-neutral-800"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Archive className="w-8 h-8 text-brand-yellow" />
                Project Archives
              </h1>
              <p className="text-neutral-400 mt-1">Loading archived projects...</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="mt-2 text-neutral-300">Loading...</p>
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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard">
              <LogoImage 
                width={200}
                height={60}
                className="h-12 w-auto"
              />
            </Link>

            <nav className="flex items-center gap-6 text-sm">
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
      <main className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/dashboard"
            className="p-2 bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors border border-neutral-800"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Archive className="w-8 h-8 text-brand-yellow" />
              Project Archives
            </h1>
            <p className="text-neutral-400 mt-1">
              {showArchived ? 'Archived' : 'Active'} projects ({filteredProjects.length})
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-neutral-900 border-neutral-700 text-white placeholder-neutral-400 w-64 focus:border-brand-yellow focus:ring-brand-yellow/20"
                />
              </div>
              
              <Button
                variant={showArchived ? "default" : "outline"}
                onClick={() => setShowArchived(!showArchived)}
                className={showArchived ? "bg-brand-yellow hover:bg-brand-yellow/90 text-black" : "border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-brand-yellow bg-neutral-900"}
              >
                <Archive className="h-4 w-4 mr-2" />
                {showArchived ? 'Show Active' : 'Show Archived'}
              </Button>
            </div>

            <Button 
              onClick={() => router.push('/admin/new-project')}
              className="bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Project
            </Button>
          </div>

        
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
              <Card key={project.id} className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 hover:shadow-lg hover:shadow-brand-yellow/10 transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg group-hover:text-brand-yellow transition-colors">{project.name}</CardTitle>
                      <CardDescription className="text-neutral-400 font-mono text-sm">{project.projectNumber}</CardDescription>
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
                <CardContent className="space-y-4">
                  <p className="text-neutral-300 text-sm line-clamp-2 leading-relaxed">{project.description}</p>

                  <div className="flex items-center space-x-2 text-neutral-400 text-sm">
                    <Mail className="h-4 w-4 text-brand-yellow/70" />
                    <span className="truncate">{project.clientEmail}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-neutral-400 text-sm">
                    <Calendar className="h-4 w-4 text-brand-yellow/70" />
                    <span>Created {formatDate(project.createdAt)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Badge 
                        variant="outline" 
                        className={project.archived ? "border-neutral-600 text-neutral-400" : "border-green-500 text-green-400 bg-green-500/10"}
                      >
                        {project.archived ? 'Archived' : 'Active'}
                      </Badge>
                      {project.downloadEnabled && (
                        <Badge variant="outline" className="border-brand-yellow text-brand-yellow bg-brand-yellow/10">
                          Download
                        </Badge>
                      )}
                    </div>
                </div>

                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/admin/project/${project.id}`)}
                      className="flex-1 border-neutral-600 text-neutral-300 hover:bg-brand-yellow hover:text-black hover:border-brand-yellow transition-colors bg-neutral-900"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/admin/project/${project.id}/edit`)}
                      className="flex-1 border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-brand-yellow hover:border-brand-yellow transition-colors bg-neutral-900"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleArchiveStatus(project.id, project.archived)}
                      className={`flex-1 transition-colors ${
                        project.archived 
                          ? "border-green-600 text-green-400 hover:bg-green-600 hover:text-white bg-neutral-900" 
                          : "border-neutral-600 text-neutral-400 hover:bg-neutral-600 hover:text-white bg-neutral-900"
                      }`}
                    >
                      {project.archived ? (
                        <>
                          <ArchiveX className="h-4 w-4 mr-2" />
                          Unarchive
                        </>
                      ) : (
                        <>
                          <Archive className="h-4 w-4 mr-2" />
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
          <div className="text-center py-16">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 max-w-md mx-auto">
              <Archive className="h-16 w-16 text-brand-yellow mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-white mb-3">
                {showArchived ? 'No archived projects' : 'No active projects'}
              </h3>
              <p className="text-neutral-400 mb-6 leading-relaxed">
                {showArchived 
                  ? 'Projects you archive will appear here for future reference'
                  : 'Active projects will appear here for ongoing work'
                }
              </p>
              <Button 
                onClick={() => router.push('/admin/new-project')}
                className="bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold px-6 py-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

