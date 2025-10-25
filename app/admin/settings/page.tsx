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
  X,
  Lock,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react'
import { useLogo } from '@/contexts/LogoContext'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { logoUrl, updateLogo, isLoading: logoLoading } = useLogo()
  
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Proofing System',
    siteDescription: 'Professional design proofing and client feedback system',
    adminEmail: 'admin@proofing-system.com',
    logoUrl: logoUrl,
  })

  // Profile update state
  const [profile, setProfile] = useState({
    email: '',
    firstName: '',
    lastName: '',
  })

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

 

  // Load admin profile
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/admin/profile')
        if (response.ok) {
          const data = await response.json()
          setProfile({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
          })
          setFormData(prev => ({ ...prev, email: data.email }))
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  // Update settings when logoUrl changes
  useEffect(() => {
    setSettings(prev => ({ ...prev, logoUrl }))
  }, [logoUrl])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUpdateProfile = async () => {
    if (!formData.email) {
      toast.error('Please enter an email address')
      return
    }

    if (!formData.password) {
      toast.error('Please enter a password')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Profile updated successfully! Logging out...')
        
        // Call logout endpoint to properly clear httpOnly cookie
        await fetch('/api/admin/logout', { method: 'POST' })
        
        // Redirect to login
        setTimeout(() => {
          router.push('/admin/login?message=Profile updated successfully. Please log in with your new credentials.')
        }, 1500)
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout title="Settings" description="Configure system settings and preferences" icon={<Settings className="h-8 w-8 text-brand-yellow" />}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-yellow border-t-transparent mx-auto"></div>
            <p className="mt-4 text-xl text-gray-300">Loading Profile...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Settings" description="Configure system settings and preferences" icon={<Settings className="h-8 w-8 text-brand-yellow" />}>
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-neutral-400">Update your email and password</p>
        </div>

        <div className="space-y-8">
          {/* Profile Update Form */}
          <Card className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-brand-yellow" />
                Update Profile
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Update your email address and password. You'll need to log in again after changing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-neutral-300">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="admin@example.com"
                    className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-neutral-300">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter new password (min 8 chars)"
                      className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleUpdateProfile}
                  disabled={isUpdating || !formData.email || !formData.password}
                  className="bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold px-6"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
