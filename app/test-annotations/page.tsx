"use client";

import AnnotationReplyTest from "@/components/AnnotationReplyTest";
import SocketTest from "@/components/SocketTest";

export default function TestAnnotationsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Annotation & Socket Test</h1>
          <p className="text-muted-foreground">
            Test the complete annotation system with real-time Socket.io
            functionality
          </p>
        </div>

        <SocketTest />
        <AnnotationReplyTest />
      </div>
    </div>
  );
}
