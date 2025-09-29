'use client';

import React from 'react';
import { AnnotationReplySystem } from './AnnotationReplySystem';

interface AnnotationConversationExampleProps {
  annotationId: string;
  projectId: string;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  isAdmin?: boolean;
}

export function AnnotationConversationExample({
  annotationId,
  projectId,
  currentUser,
  isAdmin = false
}: AnnotationConversationExampleProps) {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Annotation Conversation</h3>
        <p className="text-sm text-muted-foreground">
          Real-time conversation system with socket integration
        </p>
      </div>
      
      <AnnotationReplySystem
        annotationId={annotationId}
        projectId={projectId}
        currentUser={currentUser}
        isAdmin={isAdmin}
        className="border rounded-lg p-4"
      />
    </div>
  );
}
