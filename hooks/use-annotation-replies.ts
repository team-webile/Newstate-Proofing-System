import { useState, useEffect, useCallback } from 'react';
import { useUnifiedSocket } from './use-unified-socket';

interface AnnotationReply {
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
}

export function useAnnotationReplies({ 
  annotationId, 
  projectId, 
  currentUser 
}: UseAnnotationRepliesProps) {
  const [replies, setReplies] = useState<AnnotationReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Socket events for real-time updates
  const { 
    isConnected, 
    emitAnnotationReply,
    emitReplyEdit,
    emitReplyDelete
  } = useUnifiedSocket({
    projectId,
    events: {
      onAnnotationReplyAdded: (data) => {
        console.log('💬 Received annotationReplyAdded:', data);
        if (data.annotationId === annotationId) {
          setReplies(prev => {
            // Remove dummy message when a real reply is added
            const filteredReplies = prev.filter(reply => 
              !(reply.addedBy === 'system' && reply.content === 'No replies yet. Be the first to respond!')
            );
            return [...filteredReplies, data.reply];
          });
        }
      },
      onReplyEdited: (data) => {
        console.log('✏️ Received replyEdited:', data);
        if (data.annotationId === annotationId) {
          setReplies(prev => 
            prev.map(reply => 
              reply.id === data.reply.id 
                ? { ...reply, content: data.reply.content, isEdited: true, updatedAt: data.reply.updatedAt }
                : reply
            )
          );
        }
      },
      onReplyDeleted: (data) => {
        console.log('🗑️ Received replyDeleted:', data);
        if (data.annotationId === annotationId) {
          setReplies(prev => prev.filter(reply => reply.id !== data.replyId));
        }
      }
    }
  });

  // Fetch replies from API
  const fetchReplies = useCallback(async () => {
    if (!annotationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/annotations/reply?annotationId=${annotationId}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        setReplies(result.data || []);
      } else {
        setError(result.message || 'Failed to fetch replies');
      }
    } catch (err) {
      console.error('Error fetching replies:', err);
      setError('Failed to fetch replies');
    } finally {
      setIsLoading(false);
    }
  }, [annotationId]);

  // Add a new reply
  const addReply = useCallback(async (content: string) => {
    if (!content.trim() || !annotationId) return;

    const replyData = {
      annotationId,
      content: content.trim(),
      addedBy: currentUser.id,
      addedByName: currentUser.name,
      projectId,
      timestamp: new Date().toISOString()
    };

    try {
      // Send via socket for real-time updates
      const socketSuccess = emitAnnotationReply(replyData);
      
      if (!socketSuccess) {
        console.warn('Socket not connected, falling back to API');
        // Fallback to API if socket is not connected
        const response = await fetch('/api/annotations/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(replyData)
        });
        
        const result = await response.json();
        if (result.status === 'success') {
          setReplies(prev => [...prev, result.data]);
        }
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      setError('Failed to add reply');
    }
  }, [annotationId, currentUser, projectId, emitAnnotationReply]);

  // Edit a reply
  const editReply = useCallback(async (replyId: string, newContent: string) => {
    if (!newContent.trim()) return;

    const editData = {
      annotationId,
      replyId,
      content: newContent.trim(),
      addedBy: currentUser.id,
      projectId,
      timestamp: new Date().toISOString()
    };

    try {
      // Send via socket for real-time updates
      const socketSuccess = emitReplyEdit(editData);
      
      if (!socketSuccess) {
        console.warn('Socket not connected, falling back to API');
        // Fallback to API if socket is not connected
        const response = await fetch('/api/annotations/reply', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editData)
        });
        
        const result = await response.json();
        if (result.status === 'success') {
          setReplies(prev => 
            prev.map(reply => 
              reply.id === replyId 
                ? { ...reply, content: newContent, isEdited: true, updatedAt: new Date().toISOString() }
                : reply
            )
          );
        }
      }
    } catch (error) {
      console.error('Error editing reply:', error);
      setError('Failed to edit reply');
    }
  }, [annotationId, currentUser, projectId, emitReplyEdit]);

  // Delete a reply
  const deleteReply = useCallback(async (replyId: string) => {
    const deleteData = {
      annotationId,
      replyId,
      addedBy: currentUser.id,
      projectId,
      timestamp: new Date().toISOString()
    };

    try {
      // Send via socket for real-time updates
      const socketSuccess = emitReplyDelete(deleteData);
      
      if (!socketSuccess) {
        console.warn('Socket not connected, falling back to API');
        // Fallback to API if socket is not connected
        const response = await fetch('/api/annotations/reply', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deleteData)
        });
        
        const result = await response.json();
        if (result.status === 'success') {
          setReplies(prev => prev.filter(reply => reply.id !== replyId));
        }
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      setError('Failed to delete reply');
    }
  }, [annotationId, currentUser, projectId, emitReplyDelete]);

  // Load replies on mount
  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  return {
    replies,
    isLoading,
    error,
    isConnected,
    addReply,
    editReply,
    deleteReply,
    refetch: fetchReplies
  };
}