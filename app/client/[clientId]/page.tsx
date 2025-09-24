"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { Download, Eye, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface ClientDashboardProps {
  params: {
    clientId: string
  }
}

export default function ClientDashboard({ params }: ClientDashboardProps) {
  // Mock client data - will be replaced with real data later
  const clientData = {
    name: "Atlantic Wellness",
    projectId: "16994",
    projectName: "Atlantic Spa",
    description:
      "Please click through each element of your project to review and/or approve the element. Double check all spelling and provide any annotations and comments for revisions here.",
  }

  // Mock project elements - based on the mockups showing 4 design elements
  const projectElements = [
    {
      id: "element-1",
      name: "16994 - Atlantic Spa",
      type: "Canopy Setup",
      status: "pending",
      thumbnail: "https://placehold.co/400x300/1e40af/ffffff?text=Tent+Design+1",
      comments: 0,
      lastUpdated: "2 days ago",
    },
    {
      id: "element-2",
      name: "16994 - Atlantic Spa",
      type: "Canopy Setup",
      status: "approved",
      thumbnail: "https://placehold.co/400x300/059669/ffffff?text=Tent+Design+2",
      comments: 2,
      lastUpdated: "1 day ago",
    },
    {
      id: "element-3",
      name: "16994 - Atlantic Spa",
      type: "Canopy Setup",
      status: "revisions",
      thumbnail: "https://placehold.co/400x300/ea580c/ffffff?text=Tent+Design+3",
      comments: 3,
      lastUpdated: "3 days ago",
    },
    {
      id: "element-4",
      name: "16994 - Atlantic Spa",
      type: "Canopy Setup",
      status: "pending",
      thumbnail: "https://placehold.co/400x300/1e40af/ffffff?text=Tent+Design+4",
      comments: 1,
      lastUpdated: "1 day ago",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "revisions":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "approved":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "revisions":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <span className="text-sm text-muted-foreground">https://wetl/XOmicBPM</span>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">APPROVE PROJECT</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {clientData.projectId} - {clientData.projectName}
          </h1>
          <p className="text-muted-foreground max-w-4xl">{clientData.description}</p>
        </div>

        {/* Project Elements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {projectElements.map((element) => (
            <Card
              key={element.id}
              className="border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
            >
              <CardHeader className="p-0">
                <div className="relative aspect-[3/2] overflow-hidden rounded-t-lg">
                  <img
                    src={element.thumbnail || "/placeholder.svg"}
                    alt={element.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-2 right-2">{getStatusIcon(element.status)}</div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button size="sm" variant="secondary">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-card-foreground text-sm">{element.name}</h3>
                    <p className="text-xs text-muted-foreground">{element.type}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(element.status)}>{element.status}</Badge>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {element.comments > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {element.comments}
                        </div>
                      )}
                      <span>{element.lastUpdated}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" size="lg" className="border-border text-foreground bg-transparent">
            REQUEST REVISIONS
          </Button>
          <Button variant="outline" size="lg" className="border-border text-foreground bg-transparent">
            LEAVE ANNOTATIONS
          </Button>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            APPROVE PROJECT
          </Button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact us at{" "}
            <a href="mailto:support@newstatebranding.com" className="text-primary hover:underline">
              support@newstatebranding.com
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
