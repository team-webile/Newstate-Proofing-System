'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"
import { useParams } from "next/navigation"
import { Upload, Settings, Save, X, Image as ImageIcon, ArrowLeft } from "lucide-react"
import { CopyLinkButton } from "@/components/copy-link-button"
import AdminLayout from "../../components/AdminLayout"
import toast from 'react-hot-toast'
import Image from 'next/image'

interface Project {
  id: number
  projectNumber: string
  name: string
  description: string
  clientEmail: string
  downloadEnabled: boolean
  archived: boolean
  createdAt: string
  updatedAt: string
}

interface DesignItem {
  id: number
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  createdAt: string
}

interface Review {
  id: number
  shareLink: string
  status: string
  createdAt: string
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [designItems, setDesignItems] = useState<DesignItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    loadProjectData()
    loadFiles()
  }, [projectId])

  const loadProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
        
        // Load reviews
        const reviewsResponse = await fetch(`/api/reviews?projectId=${projectId}`)
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json()
          setReviews(reviewsData)
        }
      }
    } catch (error) {
      console.error('Error loading project:', error)
      toast.error('Failed to load project')
    } finally {
      setIsLoading(false)
    }
  }

  const loadFiles = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`)
      if (response.ok) {
        const data = await response.json()
        setDesignItems(data.data.files || [])
      }
    } catch (error) {
      console.error('Error loading files:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        toast.success('File uploaded successfully!')
        await loadFiles() // Reload files
      } else {
        toast.error('Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files?fileId=${fileId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('File deleted successfully!')
        await loadFiles() // Reload files
      } else {
        toast.error('Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    }
  }

  if (isLoading) {
  return (
      <AdminLayout title="Project Details" description="View project details and files" icon={<Save className="h-8 w-8 text-brand-yellow" />}>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-brand-yellow border-t-transparent mx-auto"></div>
            <p className="mt-4 text-lg sm:text-xl text-gray-300">Loading project...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!project) {
    return (
      <AdminLayout title="Project Details" description="Project not found" icon={<Save className="h-8 w-8 text-brand-yellow" />}>
        <div className="text-center py-12 px-4">
          <p className="text-red-400 text-sm sm:text-base">Project not found</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Edit Project" description="Update project details" icon={<Save className="h-8 w-8 text-brand-yellow" />}>
            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-2 p-2 bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors border border-neutral-800 text-neutral-400 hover:text-brand-yellow"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Back to Projects</span>
          </Link>
        </div>

        {/* Project Name Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className="text-neutral-500 mt-1 sm:mt-2 text-sm sm:text-base">✏️</span>
                <input
                  type="text"
                  defaultValue={project.name.toUpperCase()}
                  placeholder="NAME PROJECT"
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white bg-transparent border-none outline-none w-full placeholder:text-neutral-700 uppercase tracking-wide"
                />
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-neutral-500 mt-1 text-sm sm:text-base">✏️</span>
                <input
                  type="text"
                  defaultValue={project.description}
                  placeholder="Add project description or message to clients."
                  className="text-sm sm:text-base text-neutral-400 bg-transparent border-none outline-none w-full placeholder:text-neutral-700"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4">
              {project.downloadEnabled && designItems.length > 0 && (
                <button 
                  onClick={() => {
                    // Download all files
                    designItems.forEach((item, index) => {
                      setTimeout(() => {
                        const link = document.createElement('a');
                        link.href = item.url;
                        link.download = item.fileName || `design-${index + 1}`;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }, index * 500); // Stagger downloads by 500ms
                    });
                    toast.success('Download started for all files!');
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors text-sm"
                >
                  📥 Download All
                </button>
              )}
              {reviews.length > 0 && (
                <CopyLinkButton shareLink={reviews[0].shareLink} showUrl />
              )}
              <Link href={`/admin/project/${projectId}/edit`} className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-transparent border-2 border-[#fdb913] text-[#fdb913] font-bold rounded hover:bg-[#fdb913] hover:text-black transition-all uppercase tracking-wide text-xs sm:text-sm">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Project</span>
                <span className="sm:hidden">Edit</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-[#1a1d26] rounded-lg border-2 border-dashed border-neutral-700 p-6 sm:p-8 lg:p-12 mb-6 sm:mb-8">
          <div className="text-center">
            <p className="text-neutral-400 mb-4 text-sm sm:text-base px-2">
              <span className="font-semibold">Drag & drop</span> some files from your computer or hit the button below
            </p>
            <input
              type="file"
              id="file-upload"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.psd,.ai,.eps"
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-[#fdb913] text-black font-bold rounded hover:bg-[#e5a711] transition-all uppercase tracking-wide cursor-pointer text-sm sm:text-base ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Upload</span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Files Grid */}
        {designItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {designItems.map((item) => (
              <div
                key={item.id}
                className="aspect-square bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 hover:border-brand-yellow transition-all group relative"
              >
                <Image
                  src={item.url || "/placeholder.svg"}
                  alt={item.fileName}
                  width={300}       
                  height={300}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 sm:p-4">
                  <p className="text-white text-xs sm:text-sm font-semibold truncate">
                    {item.fileName}
                  </p>
                </div>
                {/* Mobile: Always visible buttons, Desktop: Show on hover */}
                <div className="absolute top-2 right-2 sm:inset-0 sm:bg-black/50 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity flex flex-row sm:flex-row items-start sm:items-center justify-end sm:justify-center gap-2 p-2 sm:p-3">
                  {reviews.length > 0 && (
                    <Link 
                      href={`/admin/review/${reviews[0].shareLink}`} 
                      className="px-2 py-1.5 sm:px-3 sm:py-2 bg-[#fdb913] text-black rounded font-semibold hover:bg-[#e5a711] transition-colors text-xs sm:text-sm sm:w-full text-center"
                      title="View client feedback"
                    >
                    <span className="hidden md:inline">View Client Feedback</span>
                    <span className="md:hidden">👁️</span>
                  </Link>
                  )}
                  <button
                    onClick={() => handleDeleteFile(item.id)}
                    className="px-2 py-1.5 sm:px-3 sm:py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition-colors sm:w-full flex items-center justify-center gap-1"
                    title="Delete file"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden md:inline">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 lg:py-16">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 max-w-md mx-auto">
              <ImageIcon className="h-12 w-12 sm:h-16 sm:w-16 text-brand-yellow mx-auto mb-4 sm:mb-6" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">No files uploaded</h3>
              <p className="text-sm sm:text-base text-neutral-400 mb-4 sm:mb-6 leading-relaxed px-4">
                Upload your first design file to get started with this project
              </p>
            </div>
          </div>
        )}
    </div>
     </AdminLayout>
  )
}

