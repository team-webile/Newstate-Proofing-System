'use client'

import { useState, useEffect } from 'react'
import { ClientsAPI, ClientWithStats, ClientListResponse } from '@/lib/clients-api'
import { CreateClientData, UpdateClientData } from '@/models/Client'

export function useClients(page: number = 1, limit: number = 10, search?: string) {
  const [data, setData] = useState<ClientListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const clientsData = await ClientsAPI.getClients(page, limit, search)
      setData(clientsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients')
    } finally {
      setLoading(false)
    }
  }

  const refreshClients = async () => {
    await fetchClients()
  }

  useEffect(() => {
    fetchClients()
  }, [page, limit, search])

  return {
    data,
    loading,
    error,
    refreshClients
  }
}

export function useClient(id: string) {
  const [client, setClient] = useState<ClientWithStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClient = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const clientData = await ClientsAPI.getClient(id)
      setClient(clientData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch client')
    } finally {
      setLoading(false)
    }
  }

  const updateClient = async (clientData: UpdateClientData) => {
    try {
      setLoading(true)
      setError(null)
      
      const updatedClient = await ClientsAPI.updateClient(id, clientData)
      if (updatedClient) {
        setClient(updatedClient)
        return { success: true }
      }
      return { success: false, error: 'Failed to update client' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const deleteClient = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const success = await ClientsAPI.deleteClient(id)
      if (success) {
        setClient(null)
        return { success: true }
      }
      return { success: false, error: 'Failed to delete client' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete client'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchClient()
    }
  }, [id])

  return {
    client,
    loading,
    error,
    updateClient,
    deleteClient,
    refreshClient: fetchClient
  }
}

export function useCreateClient() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createClient = async (clientData: CreateClientData) => {
    try {
      setLoading(true)
      setError(null)
      
      const newClient = await ClientsAPI.createClient(clientData)
      if (newClient) {
        return { success: true, client: newClient }
      }
      return { success: false, error: 'Failed to create client' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create client'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    createClient,
    loading,
    error
  }
}
