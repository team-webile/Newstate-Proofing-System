"use client"

import { useEffect } from "react"

export default function ClientPage() {
  useEffect(() => {
    // Redirect to a sample client dashboard for demo
    window.location.href = "/client/atlantic-wellness"
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Client Portal</h1>
        <p className="text-muted-foreground">Redirecting to your project...</p>
      </div>
    </div>
  )
}
