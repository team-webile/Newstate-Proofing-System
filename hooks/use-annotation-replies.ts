'use client';

import { useState, useCallback } from 'react';

interface Reply {
  id: string;
  content: string;
  addedBy: string;
  addedByName: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
}

interface UseAnnotationRepliesProps {
  annotationId: string;
  projectId: string;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  onReplyUpdate?: (replies: Reply[]) => void;
}

export function useAnnotationReplies({
  annotationId,
  projectId,
  currentUser,
  onReplyUpdate
}: UseAnnotationRepliesProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a new reply
  const addReply = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/annotations/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotationId,
          content,
          addedBy: currentUser.role,
          addedByName: currentUser.name
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        const newReply: Reply = {
          id: data.data.id,
          content: data.data.content,
          addedBy: data.data.addedBy,
          addedByName: data.data.addedByName,
          createdAt: data.data.createdAt,
          updatedAt: data.data.updatedAt,
          isEdited: data.data.isEdited || false
        };

        setReplies(prev => [...prev, newReply]);
        onReplyUpdate?.(replies.concat(newReply));
        return newReply;
      } else {
        throw new Error(data.message || 'Failed to add reply');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add reply';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [annotationId, currentUser, onReplyUpdate, replies]);

  // Edit an existing reply
  const editReply = useCallback(async (replyId: string, newContent: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/annotations/reply/${replyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          updatedBy: currentUser.role,
          updatedByName: currentUser.name
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        const updatedReply: Reply = {
          id: data.data.id,
          content: data.data.content,
          addedBy: data.data.addedBy,
          addedByName: data.data.addedByName,
          createdAt: data.data.createdAt,
          updatedAt: data.data.updatedAt,
          isEdited: data.data.isEdited || false
        };

        setReplies(prev => prev.map(reply => 
          reply.id === replyId ? updatedReply : reply
        ));
        
        const updatedReplies = replies.map(reply => 
          reply.id === replyId ? updatedReply : reply
        );
        onReplyUpdate?.(updatedReplies);
        
        return updatedReply;
      } else {
        throw new Error(data.message || 'Failed to edit reply');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit reply';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, onReplyUpdate, replies]);

  // Delete a reply
  const deleteReply = useCallback(async (replyId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/annotations/reply/${replyId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.status === 'success') {
        setReplies(prev => prev.filter(reply => reply.id !== replyId));
        
        const updatedReplies = replies.filter(reply => reply.id !== replyId);
        onReplyUpdate?.(updatedReplies);
        
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete reply');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete reply';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onReplyUpdate, replies]);

  // Check if user can edit/delete a reply
  const canModifyReply = useCallback((reply: Reply) => {
    return reply.addedBy === currentUser.role || 
           reply.addedBy === currentUser.id || 
           currentUser.role === 'Admin';
  }, [currentUser]);

  // Get reply count
  const replyCount = replies.length;

  // Get latest reply
  const latestReply = replies.length > 0 ? replies[replies.length - 1] : null;

  // Check if there are unread replies (for notifications)
  const hasUnreadReplies = useCallback((lastReadTimestamp?: string) => {
    if (!lastReadTimestamp) return replies.length > 0;
    
    return replies.some(reply => 
      new Date(reply.createdAt) > new Date(lastReadTimestamp)
    );
  }, [replies]);

  return {
    replies,
    isLoading,
    error,
    addReply,
    editReply,
    deleteReply,
    canModifyReply,
    replyCount,
    latestReply,
    hasUnreadReplies,
    setReplies
  };
}
