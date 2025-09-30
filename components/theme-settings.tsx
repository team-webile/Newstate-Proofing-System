'use client'

import { useState, useEffect } from 'react'
import { useThemeSettings } from '@/lib/use-theme-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

export function ThemeSettings() {
  const { themeSettings, loading, error, updateThemeSettings } = useThemeSettings()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    themeMode: 'dark', // Fixed to dark theme only
    primaryColor: '',
    secondaryColor: '',
    accentColor: '',
    borderRadius: '0.625rem',
    fontFamily: 'Inter',
    logoUrl: '',
    faviconUrl: '',
    customCss: ''
  })

  useEffect(() => {
    if (themeSettings) {
      setFormData({
        themeMode: 'dark', // Always use dark theme
        primaryColor: themeSettings.primaryColor || '',
        secondaryColor: themeSettings.secondaryColor || '',
        accentColor: themeSettings.accentColor || '',
        borderRadius: themeSettings.borderRadius || '0.625rem',
        fontFamily: themeSettings.fontFamily || 'Inter',
        logoUrl: themeSettings.logoUrl || '',
        faviconUrl: themeSettings.faviconUrl || '',
        customCss: themeSettings.customCss || ''
      })
    }
  }, [themeSettings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const result = await updateThemeSettings(formData)
    
    if (result.success) {
      toast({
        title: 'Theme Updated',
        description: 'Your theme settings have been updated successfully.',
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update theme settings.',
        variant: 'destructive',
      })
    }
  }

  const handleReset = () => {
    setFormData({
      themeMode: 'dark', // Always reset to dark theme
      primaryColor: '',
      secondaryColor: '',
      accentColor: '',
      borderRadius: '0.625rem',
      fontFamily: 'Inter',
      logoUrl: '',
      faviconUrl: '',
      customCss: ''
    })
  }

  if (loading) {
    return <div>Loading theme settings...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>
            Customize the appearance and branding of your proofing system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Theme Mode - DISABLED: Dark theme only */}
            <div className="space-y-2">
              <Label htmlFor="themeMode">Theme Mode</Label>
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground">🌙 Dark Theme (Fixed)</span>
                <span className="text-xs text-muted-foreground">Theme switching is disabled</span>
              </div>
            </div>

            <Separator />

            {/* Color Customization */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Color Customization</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      placeholder="#000000"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      placeholder="#000000"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      placeholder="#000000"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Layout Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Layout Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="borderRadius">Border Radius</Label>
                  <Input
                    id="borderRadius"
                    placeholder="0.625rem"
                    value={formData.borderRadius}
                    onChange={(e) => setFormData({ ...formData, borderRadius: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select
                    value={formData.fontFamily}
                    onValueChange={(value) => setFormData({ ...formData, fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select font family" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Branding */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Branding</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    placeholder="https://example.com/logo.png"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">Favicon URL</Label>
                  <Input
                    id="faviconUrl"
                    placeholder="https://example.com/favicon.ico"
                    value={formData.faviconUrl}
                    onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Custom CSS */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Custom CSS</h3>
              
              <div className="space-y-2">
                <Label htmlFor="customCss">Custom CSS Overrides</Label>
                <Textarea
                  id="customCss"
                  placeholder="/* Add your custom CSS here */"
                  value={formData.customCss}
                  onChange={(e) => setFormData({ ...formData, customCss: e.target.value })}
                  rows={6}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit">
                Save Theme Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
