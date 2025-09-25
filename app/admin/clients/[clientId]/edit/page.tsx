"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Logo } from "@/components/logo"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Client {
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
  createdAt: string
  updatedAt: string
}

export default function EditClientPage({ params }: { params: { clientId: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [client, setClient] = useState<Client | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    fetchClient()
  }, [params.clientId])

  const fetchClient = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/clients/${params.clientId}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        setClient(data.data)
        setFormData({
          name: data.data.name || '',
          email: data.data.email || '',
          phone: data.data.phone || '',
          company: data.data.company || '',
          address: data.data.address || '',
          notes: data.data.notes || ''
        })
      } else {
        setError(data.message || 'Failed to fetch client')
      }
    } catch (err) {
      setError('Failed to fetch client')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Name and email are required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)
      
      const response = await fetch(`/api/clients/${params.clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        toast({
          title: "Client Updated",
          description: "Client has been updated successfully.",
        })
        router.push('/admin/clients')
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update client",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icons.Loader2 />
          <p className="text-muted-foreground">Loading client...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Alert>
            <Icons.AlertCircle />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4"
                onClick={fetchClient}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background mx-16">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icons.ArrowLeft />
              <span className="ml-2">Back</span>
            </Button>
            <Logo />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Client</h1>
          <p className="text-muted-foreground">Update client information</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>
              Update the client's details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Client name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="client@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes about the client..."
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {saving ? (
                    <>
                      <Icons.Loader2 />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icons.Save />
                      <span className="ml-2">Save Changes</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}