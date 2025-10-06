"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { MessageCircle, Reply, X, MapPin, Trash2, Send, CheckCircle, Clock, AlertCircle, Edit2 } from "lucide-react"
import { WelcomeModal } from "./welcome-modal"

interface DesignItem {
  id: number
  file_url: string
  file_name: string
  version: number
}

interface Comment {
  id: number
  author: string
  content: string
  timestamp: Date
  replies: Reply[]
  avatar?: string
  isAdmin?: boolean
}

interface Reply {
  id: number
  author: string
  content: string
  timestamp: Date
  avatar?: string
  isAdmin?: boolean
}

type AnnotationStatus = "open" | "in_progress" | "resolved"

interface Annotation {
  id: number
  x: number
  y: number
  content: string
  author: string
  number: number
  status: AnnotationStatus
  threads: AnnotationThread[]
  createdAt: Date
  updatedAt: Date
}

interface AnnotationThread {
  id: number
  author: string
  content: string
  timestamp: Date
  isAdmin?: boolean
}

interface AdminDesignViewerProps {
  designItems: DesignItem[]
  reviewId: number
  projectId: number
  projectName: string
}

export function AdminDesignViewer({ designItems, reviewId, projectId, projectName }: AdminDesignViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [comments, setComments] = useState<Record<number, Comment[]>>({})
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState("")
  const [adminReply, setAdminReply] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  
  // Annotations state
  const [annotations, setAnnotations] = useState<Record<number, Annotation[]>>({})
  const [selectedAnnotation, setSelectedAnnotation] = useState<number | null>(null)
  const [showAnnotationHistory, setShowAnnotationHistory] = useState(true)
  const [filterStatus, setFilterStatus] = useState<AnnotationStatus | "all">("all")
  const [threadText, setThreadText] = useState("")
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // Check for author name and show welcome modal if needed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('admin_proofing_author_name')
      if (savedName) {
        setAuthorName(savedName)
        setShowWelcomeModal(false)
      } else {
        // No name found, show welcome modal
        setShowWelcomeModal(true)
      }
    }
  }, [])

  const handleWelcomeSubmit = (name: string) => {
    setAuthorName(name)
    localStorage.setItem('admin_proofing_author_name', name)
    setShowWelcomeModal(false)
  }

  const handleChangeName = () => {
    const newName = prompt("Enter your new name:", authorName)
    if (newName && newName.trim()) {
      setAuthorName(newName.trim())
      localStorage.setItem('admin_proofing_author_name', newName.trim())
    }
  }
  
  const selectedItem = designItems[selectedIndex]
  const itemComments = comments[selectedItem.id] || []
  const itemAnnotations = annotations[selectedItem.id] || []

  const handleAddReply = (commentId: number) => {
    if (!replyText.trim()) return

    const reply: Reply = {
      id: Date.now(),
      author: "Admin",
      content: replyText,
      timestamp: new Date(),
      isAdmin: true,
    }

    setComments({
      ...comments,
      [selectedItem.id]: itemComments.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
      ),
    })
    setReplyText("")
    setReplyingTo(null)
  }

  const handleAddThread = (annotationId: number) => {
    if (!threadText.trim()) return

    const thread: AnnotationThread = {
      id: Date.now(),
      author: "Admin",
      content: threadText,
      timestamp: new Date(),
      isAdmin: true,
    }

    setAnnotations({
      ...annotations,
      [selectedItem.id]: itemAnnotations.map((a) =>
        a.id === annotationId
          ? { ...a, threads: [...a.threads, thread], updatedAt: new Date() }
          : a
      ),
    })
    setThreadText("")
  }

  const handleUpdateStatus = (annotationId: number, status: AnnotationStatus) => {
    setAnnotations({
      ...annotations,
      [selectedItem.id]: itemAnnotations.map((a) =>
        a.id === annotationId ? { ...a, status, updatedAt: new Date() } : a
      ),
    })
  }

  const filteredAnnotations = itemAnnotations.filter((a) => {
    const statusMatch = filterStatus === "all" || a.status === filterStatus
    return statusMatch
  })

  const statusCounts = {
    all: itemAnnotations.length,
    open: itemAnnotations.filter((a) => a.status === "open").length,
    in_progress: itemAnnotations.filter((a) => a.status === "in_progress").length,
    resolved: itemAnnotations.filter((a) => a.status === "resolved").length,
  }

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Thumbnails Row with Admin Info */}
      <div className="flex items-start justify-between p-6 bg-[#1a1a1a]">
        {/* Thumbnails */}
        <div className="flex gap-6">
          {designItems.map((item, index) => (
            <div key={item.id} className="flex flex-col items-center gap-2">
              <button
                onClick={() => setSelectedIndex(index)}
                className={`w-32 h-32 rounded overflow-hidden border-2 transition-all ${
                  selectedIndex === index
                    ? "border-[#fdb913] ring-2 ring-[#fdb913]/50"
                    : "border-neutral-700 hover:border-neutral-600"
                }`}
              >
                <Image
                  src={item.file_url || "/placeholder.svg"}
                  alt={item.file_name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </button>
              <span className="text-sm text-white">{item.file_name}</span>
            </div>
          ))}
        </div>

        {/* Admin Info */}
        <div className="flex flex-col gap-3 min-w-[280px]">
          <div className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded text-center uppercase tracking-wide text-sm">
            Admin Review Mode
          </div>
          <div className="px-6 py-3.5 bg-transparent border-2 border-blue-500 text-blue-400 font-bold rounded text-center uppercase tracking-wide text-sm">
            Status Management Only
          </div>
        </div>
      </div>

      <div className="flex gap-6 relative flex-1 overflow-hidden">
        {/* Annotation History Sidebar */}
        <div className="w-96 bg-neutral-900 rounded-lg border-2 border-blue-600 p-4 overflow-y-auto max-h-[calc(100vh-200px)] sticky top-6">
          <div className="sticky top-0 bg-neutral-900 pb-3 border-b border-neutral-800 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                Client Feedback
              </h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs font-semibold rounded">
                  Admin View
                </span>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  filterStatus === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                All ({statusCounts.all})
              </button>
              <button
                onClick={() => setFilterStatus("open")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  filterStatus === "open"
                    ? "bg-red-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                🔴 Open ({statusCounts.open})
              </button>
              <button
                onClick={() => setFilterStatus("in_progress")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  filterStatus === "in_progress"
                    ? "bg-yellow-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                🟡 Working ({statusCounts.in_progress})
              </button>
              <button
                onClick={() => setFilterStatus("resolved")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  filterStatus === "resolved"
                    ? "bg-green-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                🟢 Fixed ({statusCounts.resolved})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredAnnotations.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-8">
                {itemAnnotations.length === 0 ? "No client feedback yet" : "No items match your filter"}
              </p>
            ) : (
              filteredAnnotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                    selectedAnnotation === annotation.id
                      ? "bg-neutral-800 border-brand-yellow"
                      : "bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600"
                  }`}
                >
                <div onClick={() => setSelectedAnnotation(annotation.id === selectedAnnotation ? null : annotation.id)}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg bg-blue-600">
                      #{annotation.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-blue-400 truncate">
                          {annotation.author}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            annotation.status === "open"
                              ? "bg-red-600/20 text-red-400"
                              : annotation.status === "in_progress"
                              ? "bg-yellow-600/20 text-yellow-400"
                              : "bg-green-600/20 text-green-400"
                          }`}
                        >
                          {annotation.status === "open" ? "🔴 Open" : annotation.status === "in_progress" ? "🟡 Working" : "🟢 Fixed"}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-300 line-clamp-2 mb-1">{annotation.content}</p>
                      {annotation.threads.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <MessageCircle className="w-3 h-3" />
                          <span>{annotation.threads.length} {annotation.threads.length === 1 ? "reply" : "replies"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedAnnotation === annotation.id && (
                  <div className="mt-3 pt-3 border-t border-neutral-700 space-y-3">
                    {/* Status Update Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(annotation.id, "open")}
                        className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded transition-all flex items-center justify-center gap-1 ${
                          annotation.status === "open"
                            ? "bg-red-600 text-white"
                            : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"
                        }`}
                      >
                        <AlertCircle className="w-3 h-3" />
                        Open
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(annotation.id, "in_progress")}
                        className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded transition-all flex items-center justify-center gap-1 ${
                          annotation.status === "in_progress"
                            ? "bg-yellow-600 text-white"
                            : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        Working
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(annotation.id, "resolved")}
                        className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded transition-all flex items-center justify-center gap-1 ${
                          annotation.status === "resolved"
                            ? "bg-green-600 text-white"
                            : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"
                        }`}
                      >
                        <CheckCircle className="w-3 h-3" />
                        Fixed
                      </button>
                    </div>

                    {/* Threads */}
                    {annotation.threads.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {annotation.threads.map((thread) => (
                          <div key={thread.id} className={`p-2 rounded text-xs ${thread.isAdmin ? 'bg-brand-yellow/10 border border-brand-yellow/30' : 'bg-neutral-900'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${thread.isAdmin ? 'bg-brand-yellow text-black' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}>
                                {thread.author.charAt(0).toUpperCase()}
                              </div>
                              <span className={`font-semibold ${thread.isAdmin ? 'text-brand-yellow' : 'text-purple-400'}`}>
                                {thread.author} {thread.isAdmin && '(You)'}
                              </span>
                              <span className="text-neutral-500 text-xs">
                                {thread.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-neutral-300 pl-7">{thread.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Admin Reply Form */}
                    <div className="space-y-2">
                      <textarea
                        value={threadText}
                        onChange={(e) => setThreadText(e.target.value)}
                        placeholder="Reply to client feedback..."
                        rows={2}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddThread(annotation.id)
                        }}
                        disabled={!threadText.trim()}
                        className="w-full px-4 py-2 bg-brand-yellow text-black text-sm font-bold rounded hover:bg-brand-yellow-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
              ))
            )}
          </div>
        </div>

        {/* Main Viewer */}
        <div className="flex-1">

          {/* Design Display */}
          <div className="bg-neutral-900 rounded-lg p-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">{selectedItem.file_name}</h3>
              <span className="text-sm text-neutral-400">Version {selectedItem.version}</span>
            </div>

            <div
              ref={imageContainerRef}
              className="bg-white rounded-lg p-8 flex items-center justify-center min-h-[600px] relative"
            >
              <Image
                src={selectedItem.file_url || "/placeholder.svg"}
                alt={selectedItem.file_name}
                width={800}
                height={800}
                className="max-w-full h-auto"
              />
            
              {/* Annotation Pin Markers */}
              {itemAnnotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="absolute group pointer-events-auto"
                  style={{ left: `${annotation.x}%`, top: `${annotation.y}%`, transform: "translate(-50%, -50%)" }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedAnnotation(annotation.id)
                  }}
                >
                  <div 
                    className={`w-10 h-10 rounded-full border-3 border-white flex items-center justify-center text-white font-bold shadow-xl cursor-pointer transition-all ${
                      selectedAnnotation === annotation.id ? "scale-125 animate-pulse bg-brand-yellow text-black" : "bg-blue-600 hover:scale-110"
                    }`}
                  >
                    <span className="text-sm">#{annotation.number}</span>
                  </div>
                  <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-neutral-900 text-white p-4 rounded-lg shadow-2xl w-72 opacity-0 group-hover:opacity-100 transition-opacity z-20 border-2 border-blue-600">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-1 rounded bg-blue-600">
                            #{annotation.number}
                          </span>
                          <p className="font-semibold text-sm text-blue-400">{annotation.author}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-200 leading-relaxed">{annotation.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* General Comments Section */}
            <div className="mt-6 p-6 bg-neutral-800 rounded-lg border border-neutral-700">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                <MessageCircle className="w-6 h-6 text-brand-yellow" />
                General Comments
                <span className="ml-2 px-2 py-1 bg-neutral-700 text-xs rounded-full">{itemComments.length}</span>
              </h4>

              {/* Existing Comments */}
              {itemComments.length > 0 && (
                <div className="mb-6 space-y-4 max-h-96 overflow-y-auto pr-2">
                  {itemComments.map((comment) => (
                    <div key={comment.id} className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-yellow to-orange-500 flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
                          {comment.author.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-brand-yellow">{comment.author}</p>
                              <p className="text-xs text-neutral-500">
                                {comment.timestamp.toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                          <p className="text-neutral-200 leading-relaxed">{comment.content}</p>

                          {/* Replies */}
                          {comment.replies.length > 0 && (
                            <div className="mt-4 space-y-3 border-l-3 border-brand-yellow/30 pl-4">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className={`rounded-lg p-3 flex items-start gap-2 ${reply.isAdmin ? 'bg-brand-yellow/10 border border-brand-yellow/30' : 'bg-neutral-800'}`}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${reply.isAdmin ? 'bg-brand-yellow text-black' : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'}`}>
                                    {reply.author.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className={`font-semibold text-sm ${reply.isAdmin ? 'text-brand-yellow' : 'text-blue-400'}`}>
                                        {reply.author} {reply.isAdmin && '(You)'}
                                      </p>
                                      <p className="text-xs text-neutral-500">
                                        {reply.timestamp.toLocaleString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          hour: "numeric",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                    </div>
                                    <p className="text-sm text-neutral-300">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply Form */}
                          {replyingTo === comment.id ? (
                            <div className="mt-4 space-y-2">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write your admin reply..."
                                rows={2}
                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAddReply(comment.id)}
                                  className="px-4 py-2 bg-brand-yellow text-black text-sm font-bold rounded hover:bg-brand-yellow-hover transition-colors flex items-center gap-2"
                                >
                                  <Send className="w-4 h-4" />
                                  Send Reply
                                </button>
                                <button
                                  onClick={() => setReplyingTo(null)}
                                  className="px-4 py-2 bg-neutral-700 text-white text-sm rounded hover:bg-neutral-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplyingTo(comment.id)}
                              className="mt-3 text-sm text-brand-yellow hover:text-brand-yellow-hover flex items-center gap-1 transition-colors"
                            >
                              <Reply className="w-4 h-4" />
                              Reply as Admin
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {itemComments.length === 0 && (
                <p className="text-neutral-500 text-center py-8">No general comments yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <WelcomeModal 
          onSubmit={handleWelcomeSubmit} 
          projectName={projectName} 
        />
      )}
    </div>
  )
}

