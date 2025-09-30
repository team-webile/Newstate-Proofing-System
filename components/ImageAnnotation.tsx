"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { PenTool, X, CheckCircle, AlertCircle, ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Lightbox from "@/components/Lightbox";

interface AnnotationReply {
  id: string;
  content: string;
  addedBy: string;
  addedByName?: string;
  createdAt: string;
}

interface Annotation {
  id: string;
  x: number;
  y: number;
  comment: string;
  timestamp: string;
  resolved: boolean;
  fileId: string;
  addedBy?: string;
  addedByName?: string;
  replies?: AnnotationReply[];
}

interface ImageAnnotationProps {
  imageUrl: string;
  imageAlt: string;
  fileId: string;
  projectId: string;
  annotations: Annotation[];
  onAnnotationAdd: (annotation: Omit<Annotation, "id" | "timestamp">) => void;
  onAnnotationResolve: (annotationId: string) => void;
  onAnnotationReply: (annotationId: string, reply: string) => void;
  isAdmin?: boolean;
  currentUser?: {
    name: string;
    role: string;
  };
  annotationsDisabled?: boolean;
  reviewStatus?: string;
  additionalImages?: string[];
}

export default function ImageAnnotation({
  imageUrl,
  imageAlt,
  fileId,
  projectId,
  annotations,
  onAnnotationAdd,
  onAnnotationResolve,
  onAnnotationReply,
  isAdmin = false,
  currentUser = { name: "User", role: "Client" },
  annotationsDisabled = false,
  reviewStatus = "PENDING",
  additionalImages = [],
}: ImageAnnotationProps) {
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] =
    useState<Annotation | null>(null);
  const [newComment, setNewComment] = useState("");
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingToAnnotation, setReplyingToAnnotation] =
    useState<Annotation | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingAnnotation) {
      // If not in annotation mode, open lightbox
      setLightboxIndex(0);
      setShowLightbox(true);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setClickPosition({ x, y });
    setNewComment("");
  };

  const handleAddAnnotation = () => {
    if (!newComment.trim()) return;

    const annotation: Omit<Annotation, "id" | "timestamp"> = {
      x: clickPosition.x,
      y: clickPosition.y,
      comment: newComment.trim(),
      resolved: false,
      fileId,
      addedBy: currentUser.role,
      addedByName: currentUser.name,
    };

    onAnnotationAdd(annotation);
    setNewComment("");
    setIsAddingAnnotation(false);
  };

  const handleAnnotationClick = (annotation: Annotation) => {
    setSelectedAnnotation(annotation);
  };

  const handleReplyClick = (annotation: Annotation) => {
    setReplyingToAnnotation(annotation);
    setShowReplyDialog(true);
    setReplyText("");
  };

  const handleReplySubmit = async () => {
    if (!replyingToAnnotation || !replyText.trim()) return;

    try {
      await onAnnotationReply(replyingToAnnotation.id, replyText.trim());
      setShowReplyDialog(false);
      setReplyingToAnnotation(null);
      setReplyText("");
    } catch (error) {
      console.error("Error submitting reply:", error);
    }
  };

  const getStatusColor = (resolved: boolean) => {
    return resolved
      ? "bg-green-500 border-green-600"
      : "bg-red-500 border-red-600";
  };

  const getStatusIcon = (resolved: boolean) => {
    return resolved ? (
      <CheckCircle className="h-3 w-3" />
    ) : (
      <AlertCircle className="h-3 w-3" />
    );
  };

  return (
    <div className="relative">
      {/* Image Container */}
      <div
        ref={imageRef}
        className="relative cursor-crosshair bg-muted rounded-lg overflow-hidden border-2 border-border"
        onClick={handleImageClick}
      >
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-auto max-h-[600px] object-contain cursor-zoom-in"
          draggable={false}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />

        {/* Fallback for broken images */}
        <div className="hidden w-full h-64 items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-2">
              <Icons.FolderOpen />
            </div>
            <p>Image failed to load</p>
            <p className="text-sm">{imageAlt}</p>
          </div>
        </div>

        {/* File info overlay */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
          <p className="font-medium">{imageAlt}</p>
        </div>

        {/* Lightbox trigger overlay */}
        {!isAddingAnnotation && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-black/80 transition-colors">
            <div className="flex items-center gap-1">
              <ZoomIn className="h-4 w-4" />
              <span>Click to zoom</span>
            </div>
          </div>
        )}

        {/* Annotation count overlay */}
        {annotations.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm">
            <div className="flex items-center gap-1">
              <Icons.MessageCircle />
              <span>{annotations.length} annotations</span>
            </div>
          </div>
        )}

        {/* Render annotations */}
        {annotations.map((annotation) => (
          <div
            key={annotation.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{
              left: `${annotation.x}%`,
              top: `${annotation.y}%`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleAnnotationClick(annotation);
            }}
          >
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${getStatusColor(
                annotation.resolved
              )}`}
            >
              {getStatusIcon(annotation.resolved)}
            </div>
          </div>
        ))}
      </div>

      {/* Annotation Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Review Status Indicator */}
          {annotationsDisabled && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Annotations are disabled - Review status: {reviewStatus}
                </span>
              </div>
            </div>
          )}

          <Button
            variant={isAddingAnnotation ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAddingAnnotation(!isAddingAnnotation)}
            disabled={annotationsDisabled}
          >
            <PenTool className="h-4 w-4 mr-2" />
            {isAddingAnnotation ? "Cancel Annotation" : "Add Annotation"}
            {annotationsDisabled && " (Disabled)"}
          </Button>

          {annotations.length > 0 && (
            <Badge variant="secondary">
              {annotations.length} annotation
              {annotations.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {isAddingAnnotation && (
          <div className="text-sm text-muted-foreground">
            Click anywhere on the image to add an annotation
          </div>
        )}
      </div>

      {/* Add Annotation Modal */}
      <Dialog
        open={isAddingAnnotation && newComment === ""}
        onOpenChange={setIsAddingAnnotation}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Annotation</DialogTitle>
            <DialogDescription>
              Add a comment at position ({clickPosition.x.toFixed(1)}%,{" "}
              {clickPosition.y.toFixed(1)}%)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="comment">Your Comment</Label>
              <Textarea
                id="comment"
                placeholder="Enter your annotation or feedback..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px]"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddingAnnotation(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddAnnotation} disabled={!newComment.trim()}>
              Add Annotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Annotation Details Modal */}
      <Dialog
        open={!!selectedAnnotation}
        onOpenChange={() => setSelectedAnnotation(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icons.MessageCircle />
              Annotation Details
            </DialogTitle>
            <DialogDescription>
              Position: ({selectedAnnotation?.x.toFixed(1)}%,{" "}
              {selectedAnnotation?.y.toFixed(1)}%)
            </DialogDescription>
          </DialogHeader>

          {selectedAnnotation && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(
                      selectedAnnotation.resolved
                    )}`}
                  />
                  <span className="text-sm font-medium">
                    {selectedAnnotation.addedByName ||
                      selectedAnnotation.addedBy ||
                      "Unknown"}
                  </span>
                  <Badge
                    variant={
                      selectedAnnotation.resolved ? "default" : "destructive"
                    }
                  >
                    {selectedAnnotation.resolved ? "Resolved" : "Pending"}
                  </Badge>
                </div>
                <p className="text-sm">{selectedAnnotation.comment}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedAnnotation.timestamp
                    ? new Date(selectedAnnotation.timestamp).toLocaleString()
                    : "Just now"}
                </p>
              </div>

              {/* Show replies if any */}
              {selectedAnnotation.replies &&
                selectedAnnotation.replies.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      Replies ({selectedAnnotation.replies.length})
                    </div>
                    {selectedAnnotation.replies.map((reply) => (
                      <div key={reply.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              reply.addedBy === "Admin"
                                ? "bg-blue-500"
                                : "bg-green-500"
                            }`}
                          ></div>
                          <span className="text-sm font-medium">
                            {reply.addedByName || reply.addedBy}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {reply.createdAt
                              ? new Date(reply.createdAt).toLocaleString()
                              : "Just now"}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              reply.addedBy === "Admin"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {reply.addedBy}
                          </span>
                        </div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => handleReplyClick(selectedAnnotation)}
                  className="flex-1"
                  disabled={annotationsDisabled}
                >
                  <Icons.MessageCircle />
                  Reply
                  {annotationsDisabled && " (Disabled)"}
                </Button>

                {isAdmin && !selectedAnnotation.resolved && (
                  <Button
                    onClick={() => {
                      onAnnotationResolve(selectedAnnotation.id);
                      setSelectedAnnotation(null);
                    }}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedAnnotation(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icons.MessageCircle />
              Reply to Annotation
            </DialogTitle>
            <DialogDescription>
              {replyingToAnnotation && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        replyingToAnnotation.addedBy === "Admin"
                          ? "bg-blue-500"
                          : "bg-green-500"
                      }`}
                    ></div>
                    <span className="text-sm font-medium">
                      {replyingToAnnotation.addedByName ||
                        replyingToAnnotation.addedBy}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {replyingToAnnotation.timestamp
                        ? new Date(
                            replyingToAnnotation.timestamp
                          ).toLocaleString()
                        : "Just now"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {replyingToAnnotation.comment}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reply">Your Reply</Label>
              <Textarea
                id="reply"
                placeholder="Enter your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[100px]"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReplySubmit} disabled={!replyText.trim()}>
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <Lightbox
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
        images={[imageUrl, ...additionalImages]}
        currentIndex={lightboxIndex}
        onIndexChange={setLightboxIndex}
        imageAlt={imageAlt}
        showNavigation={additionalImages.length > 0}
        showThumbnails={additionalImages.length > 0}
      />
    </div>
  );
}
