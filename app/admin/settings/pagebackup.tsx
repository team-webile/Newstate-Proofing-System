'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import AdminLayout from '../components/AdminLayout'
import { 
  Settings, 
  Save, 
  Globe,
  Upload,
  Image,
  X
} from 'lucide-react'
import { useLogo } from '@/contexts/LogoContext'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const { logoUrl, updateLogo, isLoading: logoLoading } = useLogo()
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Proofing System',
    siteDescription: 'Professional design proofing and client feedback system',
    adminEmail: 'admin@proofing-system.com',
    logoUrl: logoUrl,
  })

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          setSettings({
            siteName: data.siteName || 'Proofing System',
            siteDescription: data.siteDescription || 'Professional design proofing and client feedback system',
            adminEmail: data.adminEmail || 'admin@proofing-system.com',
            logoUrl: data.logoUrl || '/images/nsb-logo.png',
          })
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }

    loadSettings()
  }, [])

  // Update settings when logoUrl changes
  useEffect(() => {
    setSettings(prev => ({ ...prev, logoUrl }))
  }, [logoUrl])

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Create preview URL for immediate display
      const previewUrl = URL.createObjectURL(file)
      setLogoPreview(previewUrl)
      
      // Upload file to server
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (response.ok) {
          const result = await response.json()
          // Update logo with the server URL
          updateLogo(result.fileUrl)
          toast.success('Logo uploaded successfully!')
        } else {
          toast.error('Failed to upload logo')
        }
      } catch (error) {
        console.error('Error uploading logo:', error)
        toast.error('Failed to upload logo')
      }
    }
  }

  const removeLogo = () => {
    setLogoPreview(null)
    updateLogo('/images/nsb-logo.png')
  }

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success('Settings saved successfully!')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminLayout title="Settings" description="Configure system settings and preferences" icon={<Settings className="h-8 w-8 text-brand-yellow" />}>
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
          <p className="text-neutral-400">Configure your proofing system preferences and security settings</p>
        </div>

        <div className="space-y-8">
          {/* General Settings */}
          <Card className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Globe className="h-5 w-5 text-brand-yellow" />
                General Settings
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Basic system configuration and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload Section */}
              <div className="space-y-4">
                <Label className="text-neutral-300">Site Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-32 h-20 bg-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {logoPreview || logoUrl ? (
                        <img 
                          src={logoPreview || logoUrl} 
                          alt="Site Logo" 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <Image className="h-8 w-8 text-neutral-500" />
                      )}
                    </div>
                    {logoPreview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-600 border-red-600 text-white hover:bg-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="file"
                      id="logoUpload"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('logoUpload')?.click()}
                      className="border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-brand-yellow bg-neutral-900"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                    <p className="text-xs text-neutral-400 mt-2">Recommended: 200x60px, PNG or JPG format</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName" className="text-neutral-300">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => handleInputChange('siteName', e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail" className="text-neutral-300">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription" className="text-neutral-300">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                  rows={3}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end pt-6">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold px-8"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
