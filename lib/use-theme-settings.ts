'use client'

import { useState, useEffect } from 'react'
import { ThemeSettings } from '@/types'

export function useThemeSettings() {
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchThemeSettings()
  }, [])

  const fetchThemeSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/theme')
      const data = await response.json()
      
      if (data.status === 'success') {
        setThemeSettings(data.data)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Failed to fetch theme settings')
    } finally {
      setLoading(false)
    }
  }

  const updateThemeSettings = async (settings: Partial<ThemeSettings>) => {
    try {
      setLoading(true)
      const response = await fetch('/api/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        setThemeSettings(data.data)
        // Apply theme changes to document
        applyThemeToDocument(data.data)
        return { success: true }
      } else {
        setError(data.message)
        return { success: false, error: data.message }
      }
    } catch (err) {
      const errorMessage = 'Failed to update theme settings'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const applyThemeToDocument = (settings: ThemeSettings) => {
    // Apply theme mode
    if (settings.themeMode && settings.themeMode !== 'system') {
      document.documentElement.setAttribute('data-theme', settings.themeMode)
    }

    // Apply custom colors
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--primary', settings.primaryColor)
    }
    if (settings.secondaryColor) {
      document.documentElement.style.setProperty('--secondary', settings.secondaryColor)
    }
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--accent', settings.accentColor)
    }

    // Apply border radius
    if (settings.borderRadius) {
      document.documentElement.style.setProperty('--radius', settings.borderRadius)
    }

    // Apply font family
    if (settings.fontFamily) {
      document.documentElement.style.setProperty('--font-family', settings.fontFamily)
    }

    // Apply custom CSS
    if (settings.customCss) {
      const styleId = 'custom-theme-css'
      let styleElement = document.getElementById(styleId) as HTMLStyleElement
      
      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = styleId
        document.head.appendChild(styleElement)
      }
      
      styleElement.textContent = settings.customCss
    }
  }

  return {
    themeSettings,
    loading,
    error,
    updateThemeSettings,
    refetch: fetchThemeSettings
  }
}
