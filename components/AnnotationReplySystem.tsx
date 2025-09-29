'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Edit2, 
  Trash2, 
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Reply {
  id: string;
  content: string;
  addedBy: string;
  addedByName: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
}

interface AnnotationReplySystemProps {
  annotationId: string;
  replies: Reply[];
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  onReplyAdd: (content: string) => Promise<void>;
  onReplyEdit?: (replyId: string, newContent: string) => Promise<void>;
  onReplyDelete?: (replyId: string) => Promise<void>;
  isAdmin?: boolean;
  className?: string;
}

export function AnnotationReplySystem({
  annotationId,
  replies,
  currentUser,
  onReplyAdd,
  onReplyEdit,
  onReplyDelete,
  isAdmin = false,
  className = ''
}: AnnotationReplySystemProps) {
  const [newReply, setNewReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newReply]);

  useEffect(() => {
    if (editTextareaRef.current) {
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
    }
  }, [editContent]);

  const handleSubmitReply = async () => {
    if (!newReply.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReplyAdd(newReply.trim());
      setNewReply('');
      setShowReplyInput(false);
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReply = (reply: Reply) => {
    setEditingReply(reply.id);
    setEditContent(reply.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !editingReply) return;

    try {
      if (onReplyEdit) {
        await onReplyEdit(editingReply, editContent.trim());
      }
      setEditingReply(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing reply:', error);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!onReplyDelete) return;
    
    if (confirm('Are you sure you want to delete this reply?')) {
      try {
        await onReplyDelete(replyId);
      } catch (error) {
        console.error('Error deleting reply:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitReply();
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
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

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Admin</Badge>;
      case 'client':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Client</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Reply Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReplyInput(!showReplyInput)}
          className="flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          {replies.length > 0 ? `${replies.length} ${replies.length === 1 ? 'Reply' : 'Replies'}` : 'Add Reply'}
        </Button>
      </div>

      {/* Replies List */}
      {replies.length > 0 && (
        <div className="space-y-3">
          {replies.map((reply) => (
            <Card key={reply.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                {editingReply === reply.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <Textarea
                      ref={editTextareaRef}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyPress={handleEditKeyPress}
                      placeholder="Edit your reply..."
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={!editContent.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingReply(null);
                          setEditContent('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="space-y-3">
                    {/* Reply Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src="" />
                          <AvatarFallback className={`text-white text-xs ${getRoleColor(reply.addedBy)}`}>
                            {getInitials(reply.addedByName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{reply.addedByName}</span>
                            {getRoleBadge(reply.addedBy)}
                            {reply.isEdited && (
                              <Badge variant="outline" className="text-xs">
                                <Edit2 className="w-3 h-3 mr-1" />
                                Edited
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatTime(reply.createdAt)}
                            {reply.updatedAt && reply.updatedAt !== reply.createdAt && (
                              <span> • Updated {formatTime(reply.updatedAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions Menu */}
                      {(reply.addedBy === currentUser.id || reply.addedBy === currentUser.role || isAdmin) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditReply(reply)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteReply(reply.id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Reply Content */}
                    <div className="pl-11">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Reply Input */}
      {showReplyInput && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-sm">Add a Reply</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <Textarea
                ref={textareaRef}
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your reply here... (Press Enter to send, Shift+Enter for new line)"
                className="min-h-[100px] resize-none"
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Replying as {currentUser.name}</span>
                  {getRoleBadge(currentUser.role)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowReplyInput(false);
                      setNewReply('');
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitReply}
                    disabled={!newReply.trim() || isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
