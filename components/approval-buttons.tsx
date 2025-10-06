"use client"

import { useState, useEffect } from "react"
import { Pencil, Edit2 } from "lucide-react"
import { ApprovalModal } from "./approval-modal"
import { DrawingCanvas } from "./drawing-canvas"
import { WelcomeModal } from "./welcome-modal"
import Image from "next/image"
import { saveComment, getCommentsByReview, StoredComment } from "@/lib/storage"

interface ApprovalButtonsProps {
  reviewId: number
}

interface Comment {
  id: number
  author: string
  content: string
  timestamp: Date
  type: "comment" | "annotation"
  hasDrawing: boolean
  drawingData?: string // Base64 image data
}

export function ApprovalButtons({ reviewId }: ApprovalButtonsProps) {
  const [showModal, setShowModal] = useState(false)
  const [decision, setDecision] = useState<"approved" | "revision_requested" | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newCommentText, setNewCommentText] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false)
  const [currentDrawing, setCurrentDrawing] = useState<string | null>(null)
  const [selectedComment, setSelectedComment] = useState<number | null>(null)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  // Load comments from localStorage
  useEffect(() => {
    const stored = getCommentsByReview(reviewId)
    const loadedComments = stored.map((sc) => ({
      id: sc.id,
      author: sc.author,
      content: sc.content,
      timestamp: new Date(sc.timestamp),
      type: sc.type,
      hasDrawing: sc.hasDrawing,
      drawingData: sc.drawingData,
    }))
    setComments(loadedComments)

    // Check for saved author name
    const savedName = localStorage.getItem('client_proofing_author_name')
    if (savedName) {
      setAuthorName(savedName)
      setShowWelcomeModal(false)
    } else {
      setShowWelcomeModal(true)
    }
  }, [reviewId])

  const handleWelcomeSubmit = (name: string) => {
    setAuthorName(name)
    localStorage.setItem('client_proofing_author_name', name)
    setShowWelcomeModal(false)
  }

  const handleChangeName = () => {
    const newName = prompt("Enter your new name:", authorName)
    if (newName && newName.trim()) {
      setAuthorName(newName.trim())
      localStorage.setItem('client_proofing_author_name', newName.trim())
    }
  }

  const handleAnnotationClick = (comment: Comment) => {
    setSelectedComment(selectedComment === comment.id ? null : comment.id)
  }

  const handleApprove = () => {
    setDecision("approved")
    setShowModal(true)
  }

  const handleRequestRevision = () => {
    setDecision("revision_requested")
    setShowModal(true)
  }

  const handleAnnotations = () => {
    alert("💡 Annotation mode coming soon!")
  }

  const handleAddComment = () => {
    if (!newCommentText.trim() || !authorName.trim()) {
      alert("Please enter your name and comment")
      return
    }

    const hasDrawing = currentDrawing !== null
    const commentId = Date.now()

    const newComment: Comment = {
      id: commentId,
      author: authorName,
      content: newCommentText,
      timestamp: new Date(),
      type: hasDrawing ? "annotation" : "comment",
      hasDrawing: hasDrawing,
      drawingData: currentDrawing || undefined,
    }

    // Save to state
    setComments([...comments, newComment])

    // Save to localStorage
    const storedComment: StoredComment = {
      id: commentId,
      author: authorName,
      content: newCommentText,
      timestamp: new Date().toISOString(),
      type: hasDrawing ? "annotation" : "comment",
      hasDrawing: hasDrawing,
      drawingData: currentDrawing || undefined,
      reviewId: reviewId,
      fileId: 1, // Default file ID for general comments
    }
    saveComment(storedComment)

    // Save author name for future use
    if (typeof window !== 'undefined') {
      localStorage.setItem('client_proofing_author_name', authorName)
    }
    
    setNewCommentText("")
    setCurrentDrawing(null)
    
    // Show success message
    if (hasDrawing) {
      alert("✅ Annotation with drawing saved successfully!")
    } else {
      alert("✅ Comment saved successfully!")
    }
  }

  const handleSaveDrawing = (dataUrl: string) => {
    setCurrentDrawing(dataUrl)
    setShowDrawingCanvas(false)
    alert("✅ Drawing saved! Now add your comment text and submit.")
  }

  const getTimeAgo = (date: Date) => {
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return "today"
    if (days === 1) return "1 day ago"
    return `${days} days ago`
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mb-8">
        <button
          onClick={handleApprove}
            className="w-full px-6 py-3.5 bg-transparent border-2 border-[#fdb913] text-[#fdb913] font-bold rounded hover:bg-[#fdb913] hover:text-black transition-all uppercase tracking-wide text-sm"
        >
            Approve Project
        </button>
        <button
          onClick={handleRequestRevision}
            className="w-full px-6 py-3.5 bg-transparent border-2 border-white text-white font-bold rounded hover:bg-white hover:text-black transition-all uppercase tracking-wide text-sm"
        >
            Request Revisions
        </button>
        <button
          onClick={handleAnnotations}
            className="w-full px-6 py-3.5 bg-transparent border-2 border-white text-white font-bold rounded hover:bg-white hover:text-black transition-all uppercase tracking-wide text-sm"
          >
            Leave Annotations
          </button>
        </div>

        {/* Comments Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-6">
            {comments.map((comment) => (
              <div 
                key={comment.id}
                className={`cursor-pointer transition-all ${
                  comment.type === "annotation" 
                    ? `p-3 rounded-lg ${selectedComment === comment.id ? 'bg-[#fdb913]/30 border-2 border-[#fdb913]' : 'bg-[#fdb913]/10 border border-[#fdb913]/30'} hover:bg-[#fdb913]/20` 
                    : "hover:bg-neutral-900/50 p-2 rounded"
                }`}
                onClick={() => handleAnnotationClick(comment)}
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                    comment.type === "annotation" 
                      ? "bg-gradient-to-br from-[#fdb913] to-orange-500" 
                      : "bg-gradient-to-br from-purple-500 to-pink-500"
                  }`}>
                    {comment.type === "annotation" ? "📍" : comment.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <span className="text-white font-semibold text-sm">{comment.author}</span>
                      {comment.type === "annotation" && (
                        <span className="px-2 py-0.5 bg-[#fdb913]/20 text-[#fdb913] text-xs rounded font-semibold">
                          Annotation
                        </span>
                      )}
                      <span className="text-neutral-500 text-xs">
                        •{getTimeAgo(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-neutral-300 text-sm leading-relaxed mb-2">{comment.content}</p>
                    {comment.hasDrawing && (
                      <div className="mt-2 text-xs text-[#fdb913] flex items-center gap-1">
                        <Pencil className="w-3 h-3" />
                        {selectedComment === comment.id ? "✓ Drawing visible below" : "👁️ Click to view drawing"}
                      </div>
                    )}

                    {/* Expanded Drawing View */}
                    {selectedComment === comment.id && comment.drawingData && (
                      <div className="mt-3 rounded-lg overflow-hidden border-2 border-[#fdb913] bg-white">
                        <Image 
                          src={comment.drawingData} 
                          alt="Annotation Drawing" 
                          width={300}
                          height={200}
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment Input */}
          <div className="mt-6 pt-6 border-t border-neutral-800 space-y-3">
            {/* Name Display (Disabled) */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-neutral-900/50 rounded-lg border border-neutral-700">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="flex-1 text-white text-sm font-semibold">
                  {authorName || "Your name"}
                </span>
              </div>
              <button
                onClick={handleChangeName}
                className="p-2.5 bg-neutral-800 text-neutral-400 rounded hover:bg-neutral-700 hover:text-[#fdb913] transition-colors"
                title="Change Name"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            {/* Comment Input */}
            <div className="px-4 py-3 bg-neutral-900 rounded-lg border border-neutral-800 hover:border-neutral-700 focus-within:border-[#fdb913] transition-colors">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add comment or annotation message..."
                rows={3}
                className="w-full bg-transparent text-white text-sm outline-none placeholder:text-neutral-600 resize-none"
              />
            </div>

            {/* Drawing Button */}
            <button
              onClick={() => setShowDrawingCanvas(true)}
              className="w-full px-4 py-2.5 bg-neutral-800 border-2 border-neutral-700 text-white font-semibold rounded hover:border-[#fdb913] hover:bg-neutral-700 transition-all text-sm flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              {currentDrawing ? "Edit Drawing" : "Add Drawing"}
            </button>

            {/* Drawing Preview */}
            {currentDrawing && (
              <div className="relative rounded-lg overflow-hidden border-2 border-[#fdb913]">
                <Image 
                  src={currentDrawing} 
                  alt="Drawing Preview" 
                  width={300}
                  height={150}
                  className="w-full h-auto"
                />
                <button
                  onClick={() => setCurrentDrawing(null)}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleAddComment}
                disabled={!newCommentText.trim() || !authorName.trim()}
                className="flex-1 px-4 py-2.5 bg-[#fdb913] text-black font-bold rounded hover:bg-[#e5a711] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Submit Comment
              </button>
              <button
                onClick={() => {
                  setNewCommentText("")
                  setAuthorName("")
                  setCurrentDrawing(null)
                }}
                className="px-4 py-2.5 bg-neutral-800 text-white font-semibold rounded hover:bg-neutral-700 transition-colors text-sm"
              >
                Clear
        </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && decision && (
        <ApprovalModal reviewId={reviewId} decision={decision} onClose={() => setShowModal(false)} />
      )}

      {showDrawingCanvas && (
        <DrawingCanvas 
          onSave={handleSaveDrawing} 
          onClose={() => setShowDrawingCanvas(false)} 
        />
      )}

      {showWelcomeModal && (
        <WelcomeModal 
          onSubmit={handleWelcomeSubmit} 
          projectName="Review Project" 
        />
      )}
    </>
  )
}
