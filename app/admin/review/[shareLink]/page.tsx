'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DesignViewer } from "@/components/design-viewer"
import LogoImage from "@/components/LogoImage"
import toast from 'react-hot-toast'

interface Review {
  id: number
  projectId: number
  shareLink: string
  status: string
  createdAt: string
  updatedAt: string
  project: {
    id: number
    projectNumber: string
    name: string
    description: string
    clientEmail: string
    downloadEnabled: boolean
    archived: boolean
  }
}

interface DesignItem {
  id: number
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  createdAt: string
}

export default function AdminReviewPage() {
  const params = useParams()
  const shareLink = params.shareLink as string
  
  const [review, setReview] = useState<Review | null>(null)
  const [designItems, setDesignItems] = useState<DesignItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (shareLink) {
      loadReviewData()
    }
  }, [shareLink])

  const loadReviewData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch review data
      const reviewResponse = await fetch(`/api/reviews/${shareLink}`)
      
      if (!reviewResponse.ok) {
        if (reviewResponse.status === 404) {
          setError('Review not found. The link may be invalid or expired.')
          return
        }
        throw new Error('Failed to fetch review')
      }

      const reviewData = await reviewResponse.json()
      setReview(reviewData)

      // Fetch design items
      const filesResponse = await fetch(`/api/projects/${reviewData.project.id}/files`)
      if (filesResponse.ok) {
        const filesData = await filesResponse.json()
        setDesignItems(filesData.data.files || [])
      }

    } catch (error) {
      console.error('Error loading review:', error)
      setError('Failed to load review. Please try again later.')
      toast.error('Failed to load review')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Header */}
        <header className="bg-[#1a1a1a] border-b border-neutral-800">
          <div className="px-8 py-4">
            <div className="flex items-center gap-8">
              <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-800">
                <ArrowLeft className="w-5 h-5 text-neutral-400" />
              </div>
              <LogoImage />
              <h1 className="text-xl font-bold text-white tracking-wide">
                Loading Review...
              </h1>
            </div>
          </div>
        </header>

        {/* Loading State */}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-neutral-400 text-lg">Loading review...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Header */}
        <header className="bg-[#1a1a1a] border-b border-neutral-800">
          <div className="px-8 py-4">
            <div className="flex items-center gap-8">
              <Link
                href="/admin/projects"
                className="p-2 bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors border border-neutral-800"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-400" />
              </Link>
              <LogoImage />
              <h1 className="text-xl font-bold text-white tracking-wide">
                Review Not Found
              </h1>
            </div>
          </div>
        </header>

        {/* Error State */}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-white mb-3">Review Not Found</h2>
              <p className="text-neutral-400 mb-6 leading-relaxed">
                {error || 'The review link you are looking for could not be found. Please check the link and try again.'}
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-brand-yellow text-black font-semibold rounded hover:bg-brand-yellow/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-neutral-800">
        <div className="px-8 py-4">
          <div className="flex items-center gap-8">
            <Link
              href={`/admin/project/${review.project.id}`}
              className="p-2 bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors border border-neutral-800"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-400" />
            </Link>
            <LogoImage />
            <h1 className="text-xl font-bold text-white tracking-wide">
              {review.project.projectNumber} - {review.project.name.toUpperCase()}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content - Full Height */}
      <main className="flex-1 overflow-hidden min-h-0">
        {designItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center py-20">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 max-w-md mx-auto">
                <div className="text-neutral-400 text-6xl mb-4">📁</div>
                <h3 className="text-xl font-semibold text-white mb-3">No Files Yet</h3>
                <p className="text-neutral-400 leading-relaxed">
                  The project files haven't been uploaded yet. Please check back later or upload files to this project.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <DesignViewer
            designItems={designItems}
            reviewId={review.id}
            projectName={`${review.project.projectNumber} - ${review.project.name.toUpperCase()}`}
            hideApprovalButtons={true}
            initialStatus={review.status}
            clientEmail={review.project.clientEmail}
            isAdminView={true}
            projectId={review.project.id}
          />
        )}
      </main>
    </div>
  )
}
