"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRealtimeAnnotations } from '@/hooks/use-realtime-annotations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/icons'

interface Annotation {
  id: string
  content: string
  fileId: string
  projectId: string
  coordinates?: string
  addedBy: string
  addedByName: string
  isResolved: boolean
  status: string
  createdAt: string
  replies?: AnnotationReply[]
}

interface AnnotationReply {
  id: string
  content: string
  addedBy: string
  addedByName: string
  createdAt: string
}

interface RealtimeAnnotationManagerProps {
  projectId: string
  currentUser: {
    id: string
    name: string
  }
  onAnnotationAdd?: (annotation: Annotation) => void
  onAnnotationUpdate?: (annotation: Annotation) => void
}

export function RealtimeAnnotationManager({
  projectId,
  currentUser,
  onAnnotationAdd,
  onAnnotationUpdate
}: RealtimeAnnotationManagerProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [newAnnotation, setNewAnnotation] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Socket event handlers
  const handleAnnotationAdded = (annotation: Annotation) => {
    console.log('📝 New annotation received:', annotation)
    setAnnotations(prev => [annotation, ...prev])
    onAnnotationAdd?.(annotation)
  }

  const handleAnnotationResolved = (data: { annotationId: string; resolvedBy: string; timestamp: string }) => {
    console.log('✅ Annotation resolved:', data)
    setAnnotations(prev => prev.map(annotation => 
      annotation.id === data.annotationId 
        ? { ...annotation, isResolved: true, status: 'COMPLETED' }
        : annotation
    ))
  }

  const handleAnnotationReplyAdded = (data: { projectId: string; annotationId: string; reply: AnnotationReply; timestamp: string }) => {
    console.log('💬 New reply received:', data)
    setAnnotations(prev => prev.map(annotation => 
      annotation.id === data.annotationId 
        ? { 
            ...annotation, 
            replies: [...(annotation.replies || []), data.reply]
          }
        : annotation
    ))
  }

  const handleAnnotationStatusUpdated = (data: { annotationId: string; projectId: string; status: string; isResolved: boolean; timestamp: string }) => {
    console.log('🔄 Annotation status updated:', data)
    setAnnotations(prev => prev.map(annotation => 
      annotation.id === data.annotationId 
        ? { ...annotation, status: data.status, isResolved: data.isResolved }
        : annotation
    ))
    onAnnotationUpdate?.(annotations.find(a => a.id === data.annotationId)!)
  }

  const handleTyping = (data: { projectId: string; user: string; isTyping: boolean; timestamp: string }) => {
    console.log('⌨️ Typing indicator:', data)
    // Handle typing indicators if needed
  }

  // Initialize socket connection
  const {
    isConnected,
    typingUsers,
    addAnnotation,
    resolveAnnotation,
    addAnnotationReply,
    updateAnnotationStatus,
    sendTypingIndicator
  } = useRealtimeAnnotations(projectId, {
    onAnnotationAdded: handleAnnotationAdded,
    onAnnotationResolved: handleAnnotationResolved,
    onAnnotationReplyAdded: handleAnnotationReplyAdded,
    onAnnotationStatusUpdated: handleAnnotationStatusUpdated,
    onTyping: handleTyping
  })

  // Handle typing indicator
  const handleTypingChange = (text: string) => {
    if (text.length > 0 && !isTyping) {
      setIsTyping(true)
      sendTypingIndicator(true, currentUser.name)
    } else if (text.length === 0 && isTyping) {
      setIsTyping(false)
      sendTypingIndicator(false, currentUser.name)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        sendTypingIndicator(false, currentUser.name)
      }
    }, 1000)
  }

  // Add new annotation
  const handleAddAnnotation = async () => {
    if (!newAnnotation.trim()) return

    const annotationData = {
      content: newAnnotation,
      fileId: 'default-file', // You might want to get this from props
      projectId,
      coordinates: null,
      addedBy: currentUser.id,
      addedByName: currentUser.name,
      isResolved: false,
      status: 'PENDING'
    }

    try {
      // Send via socket for real-time updates
      addAnnotation(annotationData)

      // Also save to database
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotationData)
      })

      if (response.ok) {
        setNewAnnotation('')
        sendTypingIndicator(false, currentUser.name)
      }
    } catch (error) {
      console.error('Error adding annotation:', error)
    }
  }

  // Add reply to annotation
  const handleAddReply = async (annotationId: string) => {
    if (!replyText.trim()) return

    const replyData = {
      annotationId,
      content: replyText,
      addedBy: currentUser.id,
      addedByName: currentUser.name
    }

    try {
      // Send via socket for real-time updates
      addAnnotationReply(replyData)

      // Also save to database
      const response = await fetch('/api/annotations/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(replyData)
      })

      if (response.ok) {
        setReplyText('')
        setReplyingTo(null)
        sendTypingIndicator(false, currentUser.name)
      }
    } catch (error) {
      console.error('Error adding reply:', error)
    }
  }

  // Resolve annotation
  const handleResolveAnnotation = async (annotationId: string) => {
    try {
      // Send via socket for real-time updates
      resolveAnnotation(annotationId, currentUser.name)

      // Also update in database
      const response = await fetch(`/api/annotations/${annotationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          resolvedBy: currentUser.id,
          resolvedByName: currentUser.name
        })
      })

      if (!response.ok) {
        console.error('Error resolving annotation')
      }
    } catch (error) {
      console.error('Error resolving annotation:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-muted-foreground">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {typingUsers.length > 0 && (
          <Badge variant="secondary">
            {typingUsers.length} user{typingUsers.length > 1 ? 's' : ''} typing
          </Badge>
        )}
      </div>

      {/* Add New Annotation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.MessageSquare />
            Add Annotation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Add your annotation..."
            value={newAnnotation}
            onChange={(e) => {
              setNewAnnotation(e.target.value)
              handleTypingChange(e.target.value)
            }}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleAddAnnotation}
              disabled={!newAnnotation.trim()}
            >
              <Icons.Send className="w-4 h-4 mr-2" />
              Add Annotation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Annotations List */}
      <div className="space-y-4">
        {annotations.map((annotation) => (
          <Card key={annotation.id} className={annotation.isResolved ? 'opacity-75' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icons.User className="w-4 h-4" />
                  <span className="font-medium">{annotation.addedByName}</span>
                  <Badge variant={annotation.isResolved ? 'default' : 'secondary'}>
                    {annotation.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {!annotation.isResolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveAnnotation(annotation.id)}
                    >
                      <Icons.Check className="w-4 h-4 mr-1" />
                      Resolve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplyingTo(replyingTo === annotation.id ? null : annotation.id)}
                  >
                    <Icons.Reply className="w-4 h-4 mr-1" />
                    Reply
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{annotation.content}</p>
              
              {/* Replies */}
              {annotation.replies && annotation.replies.length > 0 && (
                <div className="space-y-2 mb-4">
                  {annotation.replies.map((reply) => (
                    <div key={reply.id} className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Icons.User className="w-3 h-3" />
                        <span className="text-sm font-medium">{reply.addedByName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {replyingTo === annotation.id && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a reply..."
                    value={replyText}
                    onChange={(e) => {
                      setReplyText(e.target.value)
                      handleTypingChange(e.target.value)
                    }}
                    className="min-h-[60px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyText('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAddReply(annotation.id)}
                      disabled={!replyText.trim()}
                    >
                      <Icons.Send className="w-4 h-4 mr-1" />
                      Reply
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {annotations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Icons.MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No annotations yet</p>
            <p className="text-sm text-muted-foreground">Add the first annotation above</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
