"use client"

import React, { useState } from 'react'
import { RealtimeAnnotationManager } from '@/components/RealtimeAnnotationManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'

export default function TestRealtimeAnnotationsPage() {
  const [projectId, setProjectId] = useState('c194c92c-230e-4596-a9a2-b05a83f21734')
  const [currentUser, setCurrentUser] = useState({
    id: 'test-user-1',
    name: 'Test User'
  })
  const [isStarted, setIsStarted] = useState(false)

  const handleAnnotationAdd = (annotation: any) => {
    console.log('📝 Annotation added:', annotation)
  }

  const handleAnnotationUpdate = (annotation: any) => {
    console.log('🔄 Annotation updated:', annotation)
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.MessageSquare />
                Real-time Annotations Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project ID:</label>
                <Input
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="Enter project ID"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Your Name:</label>
                <Input
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                />
              </div>
              <Button 
                onClick={() => setIsStarted(true)}
                className="w-full"
              >
                Start Real-time Annotations Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Real-time Annotations Test</h1>
          <p className="text-muted-foreground">
            Test the real-time annotation system. Open this page in multiple tabs to see real-time updates.
          </p>
          <div className="mt-4 flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsStarted(false)}
            >
              Back to Setup
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open(window.location.href, '_blank')}
            >
              Open in New Tab
            </Button>
          </div>
        </div>

        <RealtimeAnnotationManager
          projectId={projectId}
          currentUser={currentUser}
          onAnnotationAdd={handleAnnotationAdd}
          onAnnotationUpdate={handleAnnotationUpdate}
        />
      </div>
    </div>
  )
}
