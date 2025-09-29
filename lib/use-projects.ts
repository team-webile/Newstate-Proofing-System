'use client'

import { useState, useEffect } from 'react'
import { ProjectsAPI, ProjectWithDetails, ProjectListResponse } from '@/lib/projects-api'
import { CreateProjectData, UpdateProjectData } from '@/models/Project'

export function useProjects(page: number = 1, limit: number = 10, search?: string, status?: string) {
  const [data, setData] = useState<ProjectListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const projectsData = await ProjectsAPI.getProjects(page, limit, search, status)
      setData(projectsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }   
  }

  const refreshProjects = async () => {
    await fetchProjects()
  }

  useEffect(() => {
    fetchProjects()
  }, [page, limit, search, status])

  return {
    data,
    loading,
    error,
    refreshProjects
  }
}

export function useProject(id: string) {
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const projectData = await ProjectsAPI.getProject(id)
      setProject(projectData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project')
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (projectData: UpdateProjectData) => {
    try {
      setLoading(true)
      setError(null)
      
      const updatedProject = await ProjectsAPI.updateProject(id, projectData)
      if (updatedProject) {
        setProject(updatedProject)
        return { success: true }
      }
      return { success: false, error: 'Failed to update project' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const success = await ProjectsAPI.deleteProject(id)
      if (success) {
        setProject(null)
        return { success: true }
      }
      return { success: false, error: 'Failed to delete project' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (status: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const success = await ProjectsAPI.updateProjectStatus(id, status)
      if (success) {
        await fetchProject() // Refresh project data
        return { success: true }
      }
      return { success: false, error: 'Failed to update project status' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project status'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchProject()
    }
  }, [id])

  return {
    project,
    loading,
    error,
    updateProject,
    deleteProject,
    updateStatus,
    refreshProject: fetchProject
  }
}

export function useCreateProject() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createProject = async (projectData: CreateProjectData) => {
    try {
      setLoading(true)
      setError(null)
      
      const newProject = await ProjectsAPI.createProject(projectData)
      if (newProject) {
        return { success: true, project: newProject }
      }
      return { success: false, error: 'Failed to create project' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    createProject,
    loading,
    error
  }
}

export function useClientProjects(clientId: string) {
  const [projects, setProjects] = useState<ProjectWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClientProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const clientProjects = await ProjectsAPI.getProjectsByClient(clientId)
      setProjects(clientProjects)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch client projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clientId) {
      fetchClientProjects()
    }
  }, [clientId])

  return {
    projects,
    loading,
    error,
    refreshProjects: fetchClientProjects
  }
}
