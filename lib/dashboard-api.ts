import { ProjectWithReviews } from '@/types'

export interface DashboardStats {
  totalClients: number
  totalProjects: number
  pendingProjects: number
  activeProjects: number
}

export interface RecentProject {
  id: string
  name: string
  client: string
  status: 'pending' | 'approved' | 'revisions' | 'active'
  daysAgo: number
  thumbnail?: string
}

export interface SystemStatus {
  status: 'operational' | 'warning' | 'error'
  message: string
  lastUpdated: string
}

export class DashboardAPI {
  private static getHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getStats(): Promise<DashboardStats> {
    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: this.getHeaders()
      })
      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      throw new Error(data.message || 'Failed to fetch stats')
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Return default stats on error
      return {
        totalClients: 0,
        totalProjects: 0,
        pendingProjects: 0,
        activeProjects: 0
      }
    }
  }

  /**
   * Get recent projects
   */
  static async getRecentProjects(limit: number = 4): Promise<RecentProject[]> {
    try {
      const response = await fetch(`/api/dashboard/recent-projects?limit=${limit}`, {
        headers: this.getHeaders()
      })
      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      throw new Error(data.message || 'Failed to fetch recent projects')
    } catch (error) {
      console.error('Error fetching recent projects:', error)
      return []
    }
  }

  /**
   * Get system status
   */
  static async getSystemStatus(): Promise<SystemStatus> {
    try {
      const response = await fetch('/api/dashboard/system-status', {
        headers: this.getHeaders()
      })
      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      throw new Error(data.message || 'Failed to fetch system status')
    } catch (error) {
      console.error('Error fetching system status:', error)
      return {
        status: 'error',
        message: 'Unable to determine system status',
        lastUpdated: new Date().toISOString()
      }
    }
  }

  /**
   * Get all dashboard data in one call
   */
  static async getAllDashboardData() {
    try {
      const [stats, recentProjects, systemStatus] = await Promise.all([
        this.getStats(),
        this.getRecentProjects(),
        this.getSystemStatus()
      ])

      return {
        stats,
        recentProjects,
        systemStatus
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw error
    }
  }
}
