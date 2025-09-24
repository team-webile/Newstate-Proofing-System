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
  coordinates: string | null
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
  parentId?: string
  reply?: Comment
  comment?: Comment
}

interface RealtimeCommentUpdateData {
  elementId: string
  comment: Comment
}

interface RealtimeCommentDeleteData {
  elementId: string
  commentId: string
}

interface RealtimeElementStatusChangeData {
  elementId: string
  status: string
  approval?: unknown
  comment?: unknown
}

export const useRealtimeComments = (projectId: string, elementId?: string, onElementStatusChange?: (status: string, elementId: string) => void) => {
  const { socket, isConnected, joinProject, leaveProject, joinElement, leaveElement } = useSocket()
  const [comments, setComments] = useState<Comment[]>([])
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
          console.log('🔥 NEW COMMENT RECEIVED:', data)
          console.log('Comment ID:', data.comment.id)
          console.log('Element ID:', data.elementId)
          setComments(prev => {
            // Check if comment already exists to avoid duplicates
            const exists = prev.some(comment => comment.id === data.comment.id)
            if (exists) {
              console.log('Comment already exists, skipping...')
              return prev
            }
            
            console.log('Adding new comment to state...')
            // Ensure the comment has the right structure
            const newComment = {
              ...data.comment,
              replies: data.comment.replies || []
            }
            return [...prev, newComment]
          })
        }

    const handleNewReply = (data: RealtimeReplyData) => {
      console.log('🔥 NEW REPLY RECEIVED:', data)
      
      // Handle both admin and client API formats
      const reply = data.reply || data.comment
      const parentId = reply?.parentId || data.parentId
      
      if (!reply || !reply.id) {
        console.error('Invalid reply data:', data)
        return
      }
      
      console.log('Reply ID:', reply.id)
      console.log('Parent ID:', parentId)
      console.log('Element ID:', data.elementId)
      
      setComments(prev => {
        return prev.map(comment => {
          if (comment.id === parentId) {
            console.log('Adding reply to parent comment...')
            // Check if reply already exists to avoid duplicates
            const existingReplies = comment.replies || []
            const replyExists = existingReplies.some(existingReply => existingReply.id === reply.id)
            if (replyExists) {
              console.log('Reply already exists, skipping...')
              return comment
            }
            return {
              ...comment,
              replies: [...existingReplies, reply]
            }
          }
          return comment
        })
      })
    }

    const handleCommentUpdated = (data: RealtimeCommentUpdateData) => {
      console.log('Comment updated:', data)
      setComments(prev => {
        return prev.map(comment => {
          if (comment.id === data.comment.id) {
            return data.comment
          }
          // Also update replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === data.comment.id ? data.comment : reply
              )
            }
          }
          return comment
        })
      })
    }

    const handleCommentDeleted = (data: RealtimeCommentDeleteData) => {
      console.log('Comment deleted:', data)
      setComments(prev => {
        return prev.filter(comment => {
          if (comment.id === data.commentId) {
            return false
          }
          // Also remove from replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.filter(reply => reply.id !== data.commentId)
            }
          }
          return true
        })
      })
    }

    const handleElementStatusChanged = (data: RealtimeElementStatusChangeData) => {
      console.log('Element status changed:', data)
      // Call the callback to update the element status in the parent component
      if (onElementStatusChange) {
        onElementStatusChange(data.status, data.elementId)
      }
    }

    socket.on('new-comment', handleNewComment)
    socket.on('new-reply', handleNewReply)
    socket.on('comment-updated', handleCommentUpdated)
    socket.on('comment-deleted', handleCommentDeleted)
    socket.on('element-status-updated', handleElementStatusChanged)

    return () => {
      socket.off('new-comment', handleNewComment)
      socket.off('new-reply', handleNewReply)
      socket.off('comment-updated', handleCommentUpdated)
      socket.off('comment-deleted', handleCommentDeleted)
      socket.off('element-status-updated', handleElementStatusChanged)
    }
  }, [socket, onElementStatusChange])

  // Fetch initial comments
  const fetchComments = useCallback(async () => {
    if (!projectId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/client/comments?projectId=${projectId}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        console.log('📥 Fetched initial comments:', data.data.length, 'comments')
        setComments(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  // Fetch comments for specific element
  const fetchElementComments = useCallback(async () => {
    if (!elementId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/client/comments?elementId=${elementId}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        console.log('📥 Fetched element comments:', data.data.length, 'comments')
        setComments(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching element comments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [elementId])

  // Auto-fetch comments when component mounts or dependencies change
  useEffect(() => {
    if (elementId) {
      fetchElementComments()
    } else if (projectId) {
      fetchComments()
    }
  }, [projectId, elementId, fetchComments, fetchElementComments])

  return {
    comments,
    isLoading,
    fetchComments,
    fetchElementComments,
    isConnected
  }
}
