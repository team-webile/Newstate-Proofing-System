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
  Shield
} from 'lucide-react'
import { useLogo } from '@/contexts/LogoContext'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [emailChanged, setEmailChanged] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
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

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    currentPassword: '',
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
          setEmailForm(prev => ({ ...prev, newEmail: data.email }))
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
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  

  const handleUpdateEmail = async () => {
    if (!emailForm.currentPassword) {
      toast.error('Please enter your current password')
      return
    }

    if (!emailForm.newEmail) {
      toast.error('Please enter a new email address')
      return
    }

    if (emailForm.newEmail === profile.email) {
      toast.error('New email is the same as current email')
      return
    }

    setEmailChanged(true)
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailForm.newEmail,
          currentPassword: emailForm.currentPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Email updated successfully! Logging out...')
        
        // Call logout endpoint to properly clear httpOnly cookie
        await fetch('/api/admin/logout', { method: 'POST' })
        
        // Redirect to login
        setTimeout(() => {
          router.push('/admin/login?message=Email updated successfully. Please log in with your new email.')
        }, 1500)
      } else {
        toast.error(data.error || 'Failed to update email')
      }
    } catch (error) {
      console.error('Error updating email:', error)
      toast.error('Failed to update email')
    } finally {
      setEmailChanged(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!passwordForm.currentPassword) {
      toast.error('Please enter your current password')
      return
    }

    if (!passwordForm.newPassword) {
      toast.error('Please enter a new password')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setPasswordChanged(true)
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Password updated successfully! Logging out...')
        
        // Call logout endpoint to properly clear httpOnly cookie
        await fetch('/api/admin/logout', { method: 'POST' })
        
        // Redirect to login
        setTimeout(() => {
          router.push('/admin/login?message=Password updated successfully. Please log in with your new password.')
        }, 1500)
      } else {
        toast.error(data.error || 'Failed to update password')
      }
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('Failed to update password')
    } finally {
      setPasswordChanged(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout title="Project Details" description="View project details and files" icon={<Save className="h-8 w-8 text-brand-yellow" />}>
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
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
          <p className="text-neutral-400">Configure your proofing system preferences and security settings</p>
        </div>

        <div className="space-y-8">
       

          {/* Update Email */}
          <Card className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Mail className="h-5 w-5 text-brand-yellow" />
                Change Email Address
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Update your login email address. You'll need to log in again after changing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="newEmail" className="text-neutral-300">New Email Address</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                    placeholder="newemail@example.com"
                    className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailPassword" className="text-neutral-300">Current Password</Label>
                  <Input
                    id="emailPassword"
                    type="password"
                    value={emailForm.currentPassword}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter your current password"
                    className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleUpdateEmail}
                  disabled={emailChanged || !emailForm.newEmail || !emailForm.currentPassword}
                  className="bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold px-6"
                >
                  {emailChanged ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Update Email
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Update Password */}
          <Card className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Lock className="h-5 w-5 text-brand-yellow" />
                Change Password
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Update your account password. Must be at least 8 characters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-neutral-300">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter your current password"
                    className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-neutral-300">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password (min 8 chars)"
                      className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-neutral-300">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleUpdatePassword}
                  disabled={passwordChanged || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold px-6"
                >
                  {passwordChanged ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Update Password
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
