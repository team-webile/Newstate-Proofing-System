"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { Icons } from "@/components/icons"

interface ClientEditPageProps {
  params: {
    clientId: string
  }
}

export default function ClientEditPage({ params }: ClientEditPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - will be replaced with real data fetching
  const mockClients = {
    "1": {
      name: "Atlantic Wellness",
      email: "contact@atlanticwellness.com",
      phone: "+1 (555) 123-4567",
      company: "Atlantic Wellness",
      address: "123 Ocean Drive, Miami, FL 33139",
      notes: "Premium wellness center focusing on holistic health approaches.",
    },
    "2": {
      name: "Provectus Corp",
      email: "info@provectus.com",
      phone: "+1 (555) 987-6543",
      company: "Provectus Corp",
      address: "456 Business Blvd, New York, NY 10001",
      notes: "Technology consulting firm specializing in digital transformation.",
    },
    "3": {
      name: "Health Plus",
      email: "admin@healthplus.com",
      phone: "+1 (555) 456-7890",
      company: "Health Plus",
      address: "789 Medical Center Dr, Chicago, IL 60601",
      notes: "Multi-specialty healthcare provider with focus on preventive care.",
    },
    "4": {
      name: "Woody's Restaurant",
      email: "manager@woodys.com",
      phone: "+1 (555) 321-0987",
      company: "Woody's Restaurant",
      address: "321 Food Street, Austin, TX 78701",
      notes: "Family-owned restaurant serving authentic American cuisine since 1985.",
    },
  }

  useEffect(() => {
    // Simulate loading client data
    setTimeout(() => {
      const clientData = mockClients[params.clientId as keyof typeof mockClients]
      if (clientData) {
        setFormData(clientData)
      }
      setIsLoading(false)
    }, 500)
  }, [params.clientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // TODO: Implement actual client update
    setTimeout(() => {
      console.log("Updating client:", formData)
      setIsSubmitting(false)
      // Redirect back to clients list
      window.location.href = "/admin/clients"
    }, 1000)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading client data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/admin/clients")}>
              <Icons.ArrowLeft />
              <span className="ml-2">Back to Clients</span>
            </Button>
            <Logo />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Edit Client</h1>
            <p className="text-muted-foreground">Update client information and details</p>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Client Information</CardTitle>
              <CardDescription className="text-muted-foreground">Update the client's details below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-card-foreground">
                      Client Name *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-card-foreground">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-card-foreground">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-card-foreground">
                      Company Name
                    </Label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Atlantic Wellness"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-card-foreground">
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="123 Main St, City, State 12345"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-card-foreground">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes about this client..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    rows={4}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => (window.location.href = "/admin/clients")}
                    className="flex-1 border-border text-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Icons.Save />
                    <span className="ml-2">{isSubmitting ? "Updating..." : "Update Client"}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
