"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'
import { PenTool, X, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Annotation {
  id: string
  x: number
  y: number
  comment: string
  timestamp: string
  resolved: boolean
  fileId: string
  addedBy?: string
  addedByName?: string
}

interface ImageAnnotationProps {
  imageUrl: string
  imageAlt: string
  fileId: string
  projectId: string
  annotations: Annotation[]
  onAnnotationAdd: (annotation: Omit<Annotation, 'id' | 'timestamp'>) => void
  onAnnotationResolve: (annotationId: string) => void
  isAdmin?: boolean
  currentUser?: {
    name: string
    role: string
  }
}

export default function ImageAnnotation({
  imageUrl,
  imageAlt,
  fileId,
  projectId,
  annotations,
  onAnnotationAdd,
  onAnnotationResolve,
  isAdmin = false,
  currentUser = { name: 'User', role: 'Client' }
}: ImageAnnotationProps) {
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false)
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null)
  const [newComment, setNewComment] = useState('')
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingAnnotation) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setClickPosition({ x, y })
    setNewComment('')
  }

  const handleAddAnnotation = () => {
    if (!newComment.trim()) return

    const annotation: Omit<Annotation, 'id' | 'timestamp'> = {
      x: clickPosition.x,
      y: clickPosition.y,
      comment: newComment.trim(),
      resolved: false,
      fileId,
      addedBy: currentUser.role,
      addedByName: currentUser.name
    }

    onAnnotationAdd(annotation)
    setNewComment('')
    setIsAddingAnnotation(false)
  }

  const handleAnnotationClick = (annotation: Annotation) => {
    setSelectedAnnotation(annotation)
  }

  const getStatusColor = (resolved: boolean) => {
    return resolved 
      ? "bg-green-500 border-green-600" 
      : "bg-red-500 border-red-600"
  }

  const getStatusIcon = (resolved: boolean) => {
    return resolved ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />
  }

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
          className="w-full h-auto max-h-[600px] object-contain"
          draggable={false}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling?.classList.remove('hidden')
          }}
        />
        
        {/* Fallback for broken images */}
        <div className="hidden w-full h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Icons.FolderOpen className="h-12 w-12 mx-auto mb-2" />
            <p>Image failed to load</p>
            <p className="text-sm">{imageAlt}</p>
          </div>
        </div>
        
        {/* File info overlay */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
          <p className="font-medium">{imageAlt}</p>
        </div>
        
        {/* Annotation count overlay */}
        {annotations.length > 0 && (
          <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm">
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
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
              e.stopPropagation()
              handleAnnotationClick(annotation)
            }}
          >
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${getStatusColor(annotation.resolved)}`}
            >
              {getStatusIcon(annotation.resolved)}
            </div>
          </div>
        ))}
      </div>

      {/* Annotation Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={isAddingAnnotation ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAddingAnnotation(!isAddingAnnotation)}
          >
            <PenTool className="h-4 w-4 mr-2" />
            {isAddingAnnotation ? "Cancel Annotation" : "Add Annotation"}
          </Button>
          
          {annotations.length > 0 && (
            <Badge variant="secondary">
              {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
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
      <Dialog open={isAddingAnnotation && newComment === ''} onOpenChange={setIsAddingAnnotation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Annotation</DialogTitle>
            <DialogDescription>
              Add a comment at position ({clickPosition.x.toFixed(1)}%, {clickPosition.y.toFixed(1)}%)
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
            <Button variant="outline" onClick={() => setIsAddingAnnotation(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddAnnotation}
              disabled={!newComment.trim()}
            >
              Add Annotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Annotation Details Modal */}
      <Dialog open={!!selectedAnnotation} onOpenChange={() => setSelectedAnnotation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Annotation Details
            </DialogTitle>
            <DialogDescription>
              Position: ({selectedAnnotation?.x.toFixed(1)}%, {selectedAnnotation?.y.toFixed(1)}%)
            </DialogDescription>
          </DialogHeader>
          
          {selectedAnnotation && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedAnnotation.resolved)}`} />
                  <span className="text-sm font-medium">
                    {selectedAnnotation.addedByName || selectedAnnotation.addedBy || 'Unknown'}
                  </span>
                  <Badge variant={selectedAnnotation.resolved ? "default" : "destructive"}>
                    {selectedAnnotation.resolved ? "Resolved" : "Pending"}
                  </Badge>
                </div>
                <p className="text-sm">{selectedAnnotation.comment}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(selectedAnnotation.timestamp).toLocaleString()}
                </p>
              </div>
              
              {isAdmin && !selectedAnnotation.resolved && (
                <Button
                  onClick={() => {
                    onAnnotationResolve(selectedAnnotation.id)
                    setSelectedAnnotation(null)
                  }}
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAnnotation(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
