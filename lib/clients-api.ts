import { ClientModel, CreateClientData, UpdateClientData } from '@/models/Client'

export interface ClientWithStats {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  notes?: string
  logoUrl?: string
  brandColor?: string
  themeMode: string
  projectsCount: number
  activeProjects: number
  lastActivity: string
  createdAt: Date
  updatedAt: Date
  _count?: {
    projects: number
  }
}

export interface ClientListResponse {
  clients: ClientWithStats[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export class ClientsAPI {
  /**
   * Get all clients with pagination and search
   */
  static async getClients(page: number = 1, limit: number = 10, search?: string): Promise<ClientListResponse> {
    try {
      const response = await fetch(`/api/clients?page=${page}&limit=${limit}&search=${search || ''}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      throw new Error(data.message || 'Failed to fetch clients')
    } catch (error) {
      console.error('Error fetching clients:', error)
      return {
        clients: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      }
    }
  }

  /**
   * Get client by ID
   */
  static async getClient(id: string): Promise<ClientWithStats | null> {
    try {
      const response = await fetch(`/api/clients/${id}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      throw new Error(data.message || 'Failed to fetch client')
    } catch (error) {
      console.error('Error fetching client:', error)
      return null
    }
  }

  /**
   * Create new client
   */
  static async createClient(clientData: CreateClientData): Promise<ClientWithStats | null> {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      throw new Error(data.message || 'Failed to create client')
    } catch (error) {
      console.error('Error creating client:', error)
      return null
    }
  }

  /**
   * Update client
   */
  static async updateClient(id: string, clientData: UpdateClientData): Promise<ClientWithStats | null> {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      throw new Error(data.message || 'Failed to update client')
    } catch (error) {
      console.error('Error updating client:', error)
      return null
    }
  }

  /**
   * Delete client
   */
  static async deleteClient(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        return true
      }
      
      throw new Error(data.message || 'Failed to delete client')
    } catch (error) {
      console.error('Error deleting client:', error)
      return false
    }
  }

  /**
   * Search clients
   */
  static async searchClients(query: string): Promise<ClientWithStats[]> {
    try {
      const response = await fetch(`/api/clients/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        return data.data
      }
      
      throw new Error(data.message || 'Failed to search clients')
    } catch (error) {
      console.error('Error searching clients:', error)
      return []
    }
  }
}
