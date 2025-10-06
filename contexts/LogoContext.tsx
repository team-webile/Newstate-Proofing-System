'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import toast from 'react-hot-toast'

interface LogoContextType {
  logoUrl: string
  updateLogo: (newLogoUrl: string) => void
  isLoading: boolean
}

const LogoContext = createContext<LogoContextType | undefined>(undefined)

export const useLogo = () => {
  const context = useContext(LogoContext)
  if (context === undefined) {
    throw new Error('useLogo must be used within a LogoProvider')
  }
  return context
}

interface LogoProviderProps {
  children: ReactNode
}

export const LogoProvider: React.FC<LogoProviderProps> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState('/images/nsb-logo.png')
  const [isLoading, setIsLoading] = useState(false)

  // Load logo from settings API on mount
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const settings = await response.json()
          setLogoUrl(settings.logoUrl || '/images/nsb-logo.png')
        } else {
          console.error('Failed to load settings from API')
        }
      } catch (error) {
        console.error('Error loading logo:', error)
      }
    }

    loadLogo()
  }, [])

  const updateLogo = async (newLogoUrl: string) => {
    setIsLoading(true)
    try {
      // Update settings via API
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logoUrl: newLogoUrl }),
      })

      if (response.ok) {
        setLogoUrl(newLogoUrl)
        toast.success('Logo updated successfully!')
      } else {
        toast.error('Failed to update logo in settings')
      }
    } catch (error) {
      console.error('Error updating logo:', error)
      toast.error('Failed to update logo in settings')
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    logoUrl,
    updateLogo,
    isLoading,
  }

  return (
    <LogoContext.Provider value={value}>
      {children}
    </LogoContext.Provider>
  )
}
