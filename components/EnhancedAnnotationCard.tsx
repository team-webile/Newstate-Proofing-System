'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnnotationReplySystem } from './AnnotationReplySystem';
import { useAnnotationReplies } from '@/hooks/use-annotation-replies';

interface Annotation {
  id: string;
  content: string;
  fileId: string;
  projectId: string;
  addedBy: string;
  addedByName: string;
  coordinates?: string;
  x?: number;
  y?: number;
  isResolved: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  replies?: any[];
}

interface EnhancedAnnotationCardProps {
  annotation: Annotation;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  onAnnotationUpdate?: (annotation: Annotation) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  onAnnotationResolve?: (annotationId: string) => void;
  isAdmin?: boolean;
  className?: string;
}

export function EnhancedAnnotationCard({
  annotation,
  currentUser,
  onAnnotationUpdate,
  onAnnotationDelete,
  onAnnotationResolve,
  isAdmin = false,
  className = ''
}: EnhancedAnnotationCardProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const {
    replies,
    isLoading: repliesLoading,
    addReply,
    editReply,
    deleteReply,
    canModifyReply,
    replyCount
  } = useAnnotationReplies({
    annotationId: annotation.id,
    projectId: annotation.projectId,
    currentUser,
    onReplyUpdate: (updatedReplies) => {
      // Update annotation with new replies
      onAnnotationUpdate?.({
        ...annotation,
        replies: updatedReplies
      });
    }
  });

  const handleResolve = async () => {
    if (isResolving) return;
    
    setIsResolving(true);
    try {
      if (onAnnotationResolve) {
        await onAnnotationResolve(annotation.id);
      }
    } catch (error) {
      console.error('Error resolving annotation:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this annotation?')) {
      try {
        if (onAnnotationDelete) {
          await onAnnotationDelete(annotation.id);
        }
      } catch (error) {
        console.error('Error deleting annotation:', error);
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-green-500';
      case 'client':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const canModifyAnnotation = annotation.addedBy === currentUser.role || 
                             annotation.addedBy === currentUser.id || 
                             currentUser.role === 'Admin';

  return (
    <Card className={`border-l-4 ${annotation.isResolved ? 'border-l-green-500' : 'border-l-blue-500'} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="" />
              <AvatarFallback className={`text-white text-xs ${getRoleColor(annotation.addedBy)}`}>
                {getInitials(annotation.addedByName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{annotation.addedByName}</span>
                <Badge variant="outline" className="text-xs">
                  {annotation.addedBy}
                </Badge>
                <Badge className={`text-xs ${getStatusColor(annotation.status)}`}>
                  {getStatusIcon(annotation.status)}
                  <span className="ml-1">{annotation.status}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatTime(annotation.createdAt)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {replyCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {replyCount}
                </Badge>
              )}
            </Button>

            {canModifyAnnotation && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!annotation.isResolved && (
                    <DropdownMenuItem onClick={handleResolve} disabled={isResolving}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {isResolving ? 'Resolving...' : 'Mark as Resolved'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Annotation Content */}
          <div className="pl-11">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {annotation.content}
            </p>
          </div>

          {/* Coordinates (if available) */}
          {annotation.x !== undefined && annotation.y !== undefined && (
            <div className="pl-11">
              <Badge variant="outline" className="text-xs">
                Position: ({Math.round(annotation.x)}, {Math.round(annotation.y)})
              </Badge>
            </div>
          )}

          {/* Reply System */}
          {showReplies && (
            <div className="pl-11">
              <AnnotationReplySystem
                annotationId={annotation.id}
                replies={replies}
                currentUser={currentUser}
                onReplyAdd={addReply}
                onReplyEdit={editReply}
                onReplyDelete={deleteReply}
                isAdmin={isAdmin}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
