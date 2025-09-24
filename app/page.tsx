"use client"

import { useEffect } from "react"

export default function HomePage() {
  useEffect(() => {
    // Redirect to admin login by default
    window.location.href = "/admin/login"
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">NewState Proofing System</h1>
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  )
}
