'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

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
}

interface AnnotationReply {
  id: string
  content: string
  addedBy: string
  addedByName: string
  createdAt: string
}

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinProject: (projectId: string) => void
  leaveProject: (projectId: string) => void
  joinElement: (elementId: string) => void
  leaveElement: (elementId: string) => void
  // Annotation methods
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'timestamp'>) => void
  resolveAnnotation: (annotationId: string, resolvedBy: string) => void
  addAnnotationReply: (reply: { annotationId: string; content: string; addedBy: string; addedByName: string }) => void
  updateAnnotationStatus: (annotationId: string, status: string, resolvedBy?: string) => void
  sendTypingIndicator: (isTyping: boolean, user: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      : 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server')
      setIsConnected(true)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason)
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error)
      setIsConnected(false)
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to Socket.IO server after', attemptNumber, 'attempts')
      setIsConnected(true)
    })

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Attempting to reconnect to Socket.IO server, attempt:', attemptNumber)
    })

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket.IO reconnection error:', error)
    })

    newSocket.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed after maximum attempts')
      setIsConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const joinProject = (projectId: string) => {
    if (socket) {
      socket.emit('join-project', projectId)
    }
  }

  const leaveProject = (projectId: string) => {
    if (socket) {
      socket.emit('leave-project', projectId)
    }
  }

  const joinElement = (elementId: string) => {
    if (socket) {
      socket.emit('join-element', elementId)
    }
  }

  const leaveElement = (elementId: string) => {
    if (socket) {
      socket.emit('leave-element', elementId)
    }
  }

  // Annotation methods
  const addAnnotation = (annotation: Omit<Annotation, 'id' | 'timestamp'>) => {
    if (socket && isConnected) {
      console.log('📝 Sending addAnnotation event:', annotation)
      socket.emit('addAnnotation', {
        ...annotation,
        timestamp: new Date().toISOString()
      })
    }
  }

  const resolveAnnotation = (annotationId: string, resolvedBy: string) => {
    if (socket && isConnected) {
      console.log('✅ Sending resolveAnnotation event:', { annotationId, resolvedBy })
      socket.emit('resolveAnnotation', {
        annotationId,
        resolvedBy,
        timestamp: new Date().toISOString()
      })
    }
  }

  const addAnnotationReply = (reply: { annotationId: string; content: string; addedBy: string; addedByName: string }) => {
    if (socket && isConnected) {
      console.log('💬 Sending addAnnotationReply event:', reply)
      socket.emit('addAnnotationReply', {
        ...reply,
        timestamp: new Date().toISOString()
      })
    }
  }

  const updateAnnotationStatus = (annotationId: string, status: string, resolvedBy?: string) => {
    if (socket && isConnected) {
      console.log('🔄 Sending annotationStatusChanged event:', { annotationId, status, resolvedBy })
      socket.emit('annotationStatusChanged', {
        annotationId,
        status,
        resolvedBy,
        timestamp: new Date().toISOString()
      })
    }
  }

  const sendTypingIndicator = (isTyping: boolean, user: string) => {
    if (socket && isConnected) {
      console.log('⌨️ Sending typing indicator:', { isTyping, user })
      socket.emit('typing', {
        user,
        isTyping,
        timestamp: new Date().toISOString()
      })
    }
  }

  const value: SocketContextType = {
    socket,
    isConnected,
    joinProject,
    leaveProject,
    joinElement,
    leaveElement,
    addAnnotation,
    resolveAnnotation,
    addAnnotationReply,
    updateAnnotationStatus,
    sendTypingIndicator
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
