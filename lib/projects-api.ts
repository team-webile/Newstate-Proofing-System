import { ProjectModel, CreateProjectData, UpdateProjectData } from '@/models/Project'

export interface ProjectWithDetails {
  id: string
  title: string
  description?: string
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'
  createdAt: Date
  updatedAt: Date
  userId: string
  clientId: string
  downloadEnabled: boolean
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  customCss?: string
  logoUrl?: string
  themeMode: string
  client: {
    id: string
    name: string
    email: string
    company?: string
  }
  user: {
    id: string
    name: string
    email: string
  }
  _count: {
    reviews: number
    approvals: number
  }
  lastActivity?: string
  filesCount?: number
  thumbnail?: string
  publicLink?: string
}

export interface ProjectListResponse {
  projects: ProjectWithDetails[]
  total: number
  page: number
  limit: number
  statusCounts: {
    all: number
    active: number
    archived: number
    completed: number
  }
}

export class ProjectsAPI {
  /**
   * Get all projects with pagination, search, and filters
   */
  static async getProjects(
    page: number = 1, 
    limit: number = 10, 
    search?: string, 
    status?: string
  ): Promise<ProjectListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(status && status !== 'all' && { status })
      })
      
      const response = await fetch(`/api/projects?${params}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      throw new Error(data.message || 'Failed to fetch projects')
    } catch (error) {
      console.error('Error fetching projects:', error)
      return {
        projects: [],
        total: 0,
        page: 1,
        limit: 10,
        statusCounts: { all: 0, active: 0, archived: 0, completed: 0 }
      }
    }
  }

  /**
   * Get project by ID
   */
  static async getProject(id: string): Promise<ProjectWithDetails | null> {
    try {
      const response = await fetch(`/api/projects/${id}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      throw new Error(data.message || 'Failed to fetch project')
    } catch (error) {
      console.error('Error fetching project:', error)
      return null
    }
  }

  /**
   * Create new project
   */
  static async createProject(projectData: CreateProjectData): Promise<ProjectWithDetails | null> {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      throw new Error(data.message || 'Failed to create project')
    } catch (error) {
      console.error('Error creating project:', error)
      return null
    }
  }

  /**
   * Update project
   */
  static async updateProject(id: string, projectData: UpdateProjectData): Promise<ProjectWithDetails | null> {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      throw new Error(data.message || 'Failed to update project')
    } catch (error) {
      console.error('Error updating project:', error)
      return null
    }
  }

  /**
   * Delete project
   */
  static async deleteProject(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        return true
      }
      
      throw new Error(data.message || 'Failed to delete project')
    } catch (error) {
      console.error('Error deleting project:', error)
      return false
    }
  }

  /**
   * Get projects by client ID
   */
  static async getProjectsByClient(clientId: string): Promise<ProjectWithDetails[]> {
    try {
      const response = await fetch(`/api/clients/${clientId}/projects`)
      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      throw new Error(data.message || 'Failed to fetch client projects')
    } catch (error) {
      console.error('Error fetching client projects:', error)
      return []
    }
  }

  /**
   * Update project status
   */
  static async updateProjectStatus(id: string, status: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/projects/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        return true
      }
      
      throw new Error(data.message || 'Failed to update project status')
    } catch (error) {
      console.error('Error updating project status:', error)
      return false
    }
  }
}
