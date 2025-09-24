// API Client for centralized API management
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
    this.loadToken()
  }

  // Load token from localStorage
  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token')
    }
  }

  // Set token manually
  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  }

  // Clear token
  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
  }

  // Get headers with authorization
  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ status: string; message: string; data: T }> {
    const url = `${this.baseURL}${endpoint}`
    
    // Reload token before each request
    this.loadToken()

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // GET request
  async get<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers
    })
  }

  // POST request
  async post<T>(endpoint: string, data?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers
    })
  }

  // PUT request
  async put<T>(endpoint: string, data?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers
    })
  }

  // DELETE request
  async delete<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers
    })
  }

  // File upload request
  async upload<T>(endpoint: string, formData: FormData) {
    const url = `${this.baseURL}${endpoint}`
    this.loadToken()

    const headers: Record<string, string> = {}
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('File upload failed:', error)
      throw error
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient()

// Auth API methods
export const authApi = {
  // Login user
  login: (email: string, password: string) =>
    apiClient.post<{ user: any; token: string }>('/api/auth/login', { email, password }),

  // Register user
  register: (name: string, email: string, password: string) =>
    apiClient.post<{ user: any; token: string }>('/api/auth/register', { name, email, password }),

  // Logout user
  logout: () =>
    apiClient.post('/api/auth/logout')
}

// Projects API methods
export const projectsApi = {
  // Get all projects
  getAll: () =>
    apiClient.get<any[]>('/api/projects'),

  // Get project by ID
  getById: (id: string) =>
    apiClient.get<any>(`/api/projects/${id}`),

  // Create new project
  create: (data: { clientName: string; clientEmail: string; description?: string; downloadEnabled?: boolean }) =>
    apiClient.post<any>('/api/projects/create', data),

  // Update project
  update: (id: string, data: any) =>
    apiClient.put<any>(`/api/projects/${id}`, data),

  // Delete project
  delete: (id: string) =>
    apiClient.delete(`/api/projects/${id}`)
}

// Reviews API methods
export const reviewsApi = {
  // Get all reviews
  getAll: (params?: { projectId?: string }) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    return apiClient.get<any[]>(`/api/reviews${queryString}`)
  },

  // Get review by ID
  getById: (id: string) =>
    apiClient.get<any>(`/api/reviews/${id}`),

  // Create new review
  create: (data: any) =>
    apiClient.post<any>('/api/reviews', data),

  // Update review
  update: (id: string, data: any) =>
    apiClient.put<any>(`/api/reviews/${id}`, data),

  // Delete review
  delete: (id: string) =>
    apiClient.delete(`/api/reviews/${id}`)
}

// Elements API methods
export const elementsApi = {
  // Get all elements
  getAll: (params?: { reviewId?: string }) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    return apiClient.get<any[]>(`/api/elements${queryString}`)
  },

  // Get element by ID
  getById: (id: string) =>
    apiClient.get<any>(`/api/elements/${id}`),

  // Create new element
  create: (data: any) =>
    apiClient.post<any>('/api/elements', data),

  // Update element
  update: (id: string, data: any) =>
    apiClient.put<any>(`/api/elements/${id}`, data),

  // Delete element
  delete: (id: string) =>
    apiClient.delete(`/api/elements/${id}`)
}

// Comments API methods
export const commentsApi = {
  // Get all comments
  getAll: (elementId?: string, type?: string) => {
    const params = new URLSearchParams()
    if (elementId) params.append('elementId', elementId)
    if (type) params.append('type', type)
    const queryString = params.toString()
    return apiClient.get<any[]>(`/api/comments${queryString ? `?${queryString}` : ''}`)
  },

  // Create new comment
  create: (data: { content: string; x?: number; y?: number; type?: string; elementId: string }) =>
    apiClient.post<any>('/api/comments', data),

  // Update comment
  update: (id: string, data: any) =>
    apiClient.put<any>(`/api/comments/${id}`, data),

  // Delete comment
  delete: (id: string) =>
    apiClient.delete(`/api/comments/${id}`)
}

// Approvals API methods
export const approvalsApi = {
  // Get all approvals
  getAll: (elementId?: string, projectId?: string, type?: string) => {
    const params = new URLSearchParams()
    if (elementId) params.append('elementId', elementId)
    if (projectId) params.append('projectId', projectId)
    if (type) params.append('type', type)
    const queryString = params.toString()
    return apiClient.get<any[]>(`/api/approvals${queryString ? `?${queryString}` : ''}`)
  },

  // Create new approval
  create: (data: { firstName: string; lastName: string; type: string; elementId?: string; projectId?: string; signature: string; userName: string }) =>
    apiClient.post<any>('/api/approvals', data)
}

// Client API methods (for client dashboard)
export const clientApi = {
  // Get project by share link
  getProjectByShareLink: (shareLink: string) =>
    apiClient.get<any>(`/api/client/project/${shareLink}`),
  
  // Submit approval
  submitApproval: (data: any) =>
    apiClient.post<any>('/api/client/approvals', data),
  
  // Submit comment
  submitComment: (data: any) =>
    apiClient.post<any>('/api/client/comments', data)
}



// Settings API methods
export const settingsApi = {
  // Get settings
  get: () =>
    apiClient.get<any>('/api/settings'),

  // Update settings
  update: (data: { approvalMessage?: string; signatureMessage?: string; companyName?: string }) =>
    apiClient.put<any>('/api/settings', data)
}

// Upload API methods
export const uploadApi = {
  // Upload file
  upload: (formData: FormData) =>
    apiClient.upload<any>('/api/upload', formData)
}

// Export the main API client instance
export default apiClient
