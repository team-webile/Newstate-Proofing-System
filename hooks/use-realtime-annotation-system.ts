import { useEffect, useState, useCallback, useRef } from 'react'
import { useSocket } from '@/lib/socket-context'

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
  timestamp: string
  replies?: AnnotationReply[]
}

interface AnnotationReply {
  id: string
  content: string
  addedBy: string
  addedByName: string
  createdAt: string
}

interface RealtimeAnnotationSystemProps {
  projectId: string
  fileId?: string
  currentUser: {
    id: string
    name: string
    role: string
  }
}

interface RealtimeAnnotationSystemReturn {
  annotations: Annotation[]
  isConnected: boolean
  typingUsers: string[]
  addAnnotation: (content: string, coordinates?: { x: number; y: number }) => Promise<void>
  resolveAnnotation: (annotationId: string) => Promise<void>
  addReply: (annotationId: string, content: string) => Promise<void>
  updateAnnotationStatus: (annotationId: string, status: string) => Promise<void>
  sendTypingIndicator: (isTyping: boolean) => void
  refreshAnnotations: () => Promise<void>
}

export function useRealtimeAnnotationSystem({
  projectId,
  fileId,
  currentUser
}: RealtimeAnnotationSystemProps): RealtimeAnnotationSystemReturn {
  const { socket, isConnected, addAnnotation: socketAddAnnotation, resolveAnnotation: socketResolveAnnotation, addAnnotationReply: socketAddAnnotationReply, updateAnnotationStatus: socketUpdateAnnotationStatus, sendTypingIndicator: socketSendTypingIndicator } = useSocket()
  
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load initial annotations
  const refreshAnnotations = useCallback(async () => {
    try {
      const params = new URLSearchParams({ projectId })
      if (fileId) params.append('fileId', fileId)
      
      const response = await fetch(`/api/annotations?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (data.status === 'success') {
          setAnnotations(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading annotations:', error)
    }
  }, [projectId, fileId])

  // Load annotations on mount
  useEffect(() => {
    refreshAnnotations()
  }, [refreshAnnotations])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleAnnotationAdded = (annotation: Annotation) => {
      console.log('📝 Received annotationAdded:', annotation)
      setAnnotations(prev => {
        // Check if annotation already exists to avoid duplicates
        const exists = prev.some(a => a.id === annotation.id)
        if (exists) return prev
        return [annotation, ...prev]
      })
    }

    const handleAnnotationResolved = (data: { annotationId: string; resolvedBy: string; timestamp: string }) => {
      console.log('✅ Received annotationResolved:', data)
      setAnnotations(prev => prev.map(annotation => 
        annotation.id === data.annotationId 
          ? { ...annotation, isResolved: true, status: 'COMPLETED' }
          : annotation
      ))
    }

    const handleAnnotationReplyAdded = (data: { projectId: string; annotationId: string; reply: AnnotationReply; timestamp: string }) => {
      console.log('💬 Received annotationReplyAdded:', data)
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
      console.log('🔄 Received annotationStatusUpdated:', data)
      setAnnotations(prev => prev.map(annotation => 
        annotation.id === data.annotationId 
          ? { ...annotation, status: data.status, isResolved: data.isResolved }
          : annotation
      ))
    }

    const handleTyping = (data: { projectId: string; user: string; isTyping: boolean; timestamp: string }) => {
      console.log('⌨️ Received typing indicator:', data)
      setTypingUsers(prev => {
        if (data.isTyping) {
          return [...prev.filter(user => user !== data.user), data.user]
        } else {
          return prev.filter(user => user !== data.user)
        }
      })
    }

    // Register event listeners
    socket.on('annotationAdded', handleAnnotationAdded)
    socket.on('annotationResolved', handleAnnotationResolved)
    socket.on('annotationReplyAdded', handleAnnotationReplyAdded)
    socket.on('annotationStatusUpdated', handleAnnotationStatusUpdated)
    socket.on('typing', handleTyping)

    // Cleanup
    return () => {
      socket.off('annotationAdded', handleAnnotationAdded)
      socket.off('annotationResolved', handleAnnotationResolved)
      socket.off('annotationReplyAdded', handleAnnotationReplyAdded)
      socket.off('annotationStatusUpdated', handleAnnotationStatusUpdated)
      socket.off('typing', handleTyping)
    }
  }, [socket])

  // Add annotation
  const addAnnotation = useCallback(async (content: string, coordinates?: { x: number; y: number }) => {
    if (!isConnected) {
      console.error('Socket not connected')
      return
    }

    const annotationData = {
      content,
      fileId: fileId || 'default-file',
      projectId,
      coordinates: coordinates ? JSON.stringify(coordinates) : null,
      addedBy: currentUser.id,
      addedByName: currentUser.name,
      isResolved: false,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    }

    try {
      // Send via socket for real-time updates
      socketAddAnnotation(annotationData)

      // Also save to database
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotationData)
      })

      if (!response.ok) {
        console.error('Failed to save annotation to database')
      }
    } catch (error) {
      console.error('Error adding annotation:', error)
    }
  }, [isConnected, fileId, projectId, currentUser, socketAddAnnotation])

  // Resolve annotation
  const resolveAnnotation = useCallback(async (annotationId: string) => {
    if (!isConnected) {
      console.error('Socket not connected')
      return
    }

    try {
      // Send via socket for real-time updates
      socketResolveAnnotation(annotationId, currentUser.name)

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
        console.error('Failed to update annotation status in database')
      }
    } catch (error) {
      console.error('Error resolving annotation:', error)
    }
  }, [isConnected, currentUser, socketResolveAnnotation])

  // Add reply
  const addReply = useCallback(async (annotationId: string, content: string) => {
    if (!isConnected) {
      console.error('Socket not connected')
      return
    }

    const replyData = {
      annotationId,
      content,
      addedBy: currentUser.id,
      addedByName: currentUser.name
    }

    try {
      // Send via socket for real-time updates
      socketAddAnnotationReply(replyData)

      // Also save to database
      const response = await fetch('/api/annotations/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(replyData)
      })

      if (!response.ok) {
        console.error('Failed to save reply to database')
      }
    } catch (error) {
      console.error('Error adding reply:', error)
    }
  }, [isConnected, currentUser, socketAddAnnotationReply])

  // Update annotation status
  const updateAnnotationStatus = useCallback(async (annotationId: string, status: string) => {
    if (!isConnected) {
      console.error('Socket not connected')
      return
    }

    try {
      // Send via socket for real-time updates
      socketUpdateAnnotationStatus(annotationId, status, currentUser.name)

      // Also update in database
      const response = await fetch(`/api/annotations/${annotationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          resolvedBy: currentUser.id,
          resolvedByName: currentUser.name
        })
      })

      if (!response.ok) {
        console.error('Failed to update annotation status in database')
      }
    } catch (error) {
      console.error('Error updating annotation status:', error)
    }
  }, [isConnected, currentUser, socketUpdateAnnotationStatus])

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!isConnected) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Send typing indicator
    socketSendTypingIndicator(isTyping, currentUser.name)

    // Set timeout to stop typing indicator
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socketSendTypingIndicator(false, currentUser.name)
      }, 1000)
    }
  }, [isConnected, currentUser, socketSendTypingIndicator])

  return {
    annotations,
    isConnected,
    typingUsers,
    addAnnotation,
    resolveAnnotation,
    addReply,
    updateAnnotationStatus,
    sendTypingIndicator,
    refreshAnnotations
  }
}
