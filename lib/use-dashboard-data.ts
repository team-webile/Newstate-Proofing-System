'use client'

import { useState, useEffect } from 'react'
import { DashboardAPI, DashboardStats, RecentProject, SystemStatus } from '@/lib/dashboard-api'

export interface DashboardData {
  stats: DashboardStats
  recentProjects: RecentProject[]
  systemStatus: SystemStatus
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const dashboardData = await DashboardAPI.getAllDashboardData()
      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    await fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    data,
    loading,
    error,
    refreshData
  }
}
