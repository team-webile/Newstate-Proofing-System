'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSocket } from './socket-context'

interface Comment {
  id: string
  type: string
  status: string
  createdAt: string
  updatedAt: string
  elementId: string
  commentText: string
  coordinates: any
  userName: string
  parentId: string | null
  replies?: Comment[]
}

interface RealtimeCommentData {
  elementId: string
  comment: Comment
}

interface RealtimeReplyData {
  elementId: string
  reply: Comment
}

interface RealtimeCommentDeleteData {
  elementId: string
  commentId: string
}

export const useRealtimeCommentCount = (projectId: string, elementId?: string) => {
  const { socket, isConnected, joinProject, leaveProject, joinElement, leaveElement } = useSocket()
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Join/leave project and element rooms
  useEffect(() => {
    if (isConnected && projectId) {
      joinProject(projectId)
      if (elementId) {
        joinElement(elementId)
      }
    }

    return () => {
      if (projectId) {
        leaveProject(projectId)
      }
      if (elementId) {
        leaveElement(elementId)
      }
    }
  }, [isConnected, projectId, elementId, joinProject, leaveProject, joinElement, leaveElement])

  // Listen for real-time events
  useEffect(() => {
    if (!socket) return

    const handleNewComment = (data: RealtimeCommentData) => {
      setCommentCounts(prev => ({
        ...prev,
        [data.elementId]: (prev[data.elementId] || 0) + 1
      }))
    }

    const handleNewReply = (data: RealtimeReplyData) => {
      setCommentCounts(prev => ({
        ...prev,
        [data.elementId]: (prev[data.elementId] || 0) + 1
      }))
    }

    const handleCommentDeleted = (data: RealtimeCommentDeleteData) => {
      setCommentCounts(prev => ({
        ...prev,
        [data.elementId]: Math.max(0, (prev[data.elementId] || 1) - 1)
      }))
    }

    socket.on('new-comment', handleNewComment)
    socket.on('new-reply', handleNewReply)
    socket.on('comment-deleted', handleCommentDeleted)

    return () => {
      socket.off('new-comment', handleNewComment)
      socket.off('new-reply', handleNewReply)
      socket.off('comment-deleted', handleCommentDeleted)
    }
  }, [socket])

  // Fetch initial comment counts for all elements in project
  const fetchCommentCounts = useCallback(async () => {
    if (!projectId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/client/comments?projectId=${projectId}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        // Group comments by elementId and count them
        const counts: Record<string, number> = {}
        data.data.forEach((comment: Comment) => {
          counts[comment.elementId] = (counts[comment.elementId] || 0) + 1
          // Also count replies
          if (comment.replies) {
            counts[comment.elementId] += comment.replies.length
          }
        })
        
        setCommentCounts(counts)
      }
    } catch (error) {
      console.error('Error fetching comment counts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  // Auto-fetch comment counts when component mounts
  useEffect(() => {
    if (projectId) {
      fetchCommentCounts()
    }
  }, [projectId, fetchCommentCounts])

  // Get comment count for specific element
  const getCommentCount = (elementId: string, fallbackCount?: number) => {
    return commentCounts[elementId] ?? fallbackCount ?? 0
  }

  return {
    commentCounts,
    getCommentCount,
    isLoading,
    fetchCommentCounts,
    isConnected
  }
}
