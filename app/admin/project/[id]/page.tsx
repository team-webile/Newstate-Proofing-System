'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"
import { useParams } from "next/navigation"
import { Upload, Settings, Save, X, Image as ImageIcon, ArrowLeft, Trash, Star, StarOff } from "lucide-react"
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
  url: string
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
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoadingFiles, setIsLoadingFiles] = useState(true)
  const [previewFileId, setPreviewFileId] = useState<number | null>(null)
  const [settingPreview, setSettingPreview] = useState<number | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [filesPerPage] = useState(8) // Show 8 files per page for better performance
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredFiles, setFilteredFiles] = useState<DesignItem[]>([])

  useEffect(() => {
    loadProjectData()
    loadFiles()
  }, [projectId])

  // Filter files based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFiles(designItems)
    } else {
      const filtered = designItems.filter(item =>
        item.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredFiles(filtered)
    }
    setCurrentPage(1) // Reset to first page when filtering
  }, [designItems, searchTerm])

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
    setIsLoadingFiles(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/files`)
      if (response.ok) {
        const data = await response.json()
        setDesignItems(data.data.files || [])
        // Load preview after files are loaded
        await loadCurrentPreview(data.data.files || [])
      }
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const loadCurrentPreview = async (files: DesignItem[] = designItems) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/preview`)
      if (response.ok) {
        const data = await response.json()
        // Find the file ID that matches the preview URL
        const previewFile = files.find(item => item.url === data.preview?.url)
        if (previewFile) {
          setPreviewFileId(previewFile.id)
        }
      }
    } catch (error) {
      console.error('Error loading current preview:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    let successCount = 0
    let errorCount = 0

    try {
      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)

        try {
          const response = await fetch(`/api/projects/${projectId}/files`, {
            method: 'POST',
            body: formData,
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
            console.error(`Failed to upload ${file.name}`)
          }
        } catch (error) {
          errorCount++
          console.error(`Error uploading ${file.name}:`, error)
        }
      }

      // Show results
      if (successCount > 0 && errorCount === 0) {
        toast.success(`${successCount} file(s) uploaded successfully!`)
      } else if (successCount > 0 && errorCount > 0) {
        toast.success(`${successCount} file(s) uploaded, ${errorCount} failed`)
      } else {
        toast.error('Failed to upload files')
      }

      // Reload files and project data
      await loadFiles()
      await loadProjectData()
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    // Create a fake event to reuse the upload handler
    const fakeEvent = {
      target: {
        files: files,
        value: ''
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>

    handleFileUpload(fakeEvent)
  }

  const handleDeleteFile = async (fileId: number) => {
    setDeletingFileId(fileId)
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
    } finally {
      setDeletingFileId(null)
    }
  }

  const handleSetPreview = async (fileId: number) => {
    setSettingPreview(fileId)
    try {
      const response = await fetch(`/api/projects/${projectId}/set-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      })

      if (response.ok) {
        setPreviewFileId(fileId)
        toast.success('Preview image set successfully!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to set preview image')
      }
    } catch (error) {
      console.error('Error setting preview:', error)
      toast.error('Failed to set preview image')
    } finally {
      setSettingPreview(null)
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
      <div className="min-h-screen bg-black">
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
        <div
          className={`bg-[#1a1d26] rounded-lg border-2 border-dashed p-6 sm:p-8 lg:p-12 mb-6 sm:mb-8 transition-colors ${isDragOver
              ? 'border-[#fdb913] bg-[#fdb913]/10'
              : 'border-neutral-700'
            } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            {isDragOver ? (
              <div className="mb-4">
                <div className="text-4xl mb-2">📁</div>
                <p className="text-[#fdb913] font-semibold text-lg">Drop files here!</p>
                <p className="text-neutral-400 text-sm">Release to upload multiple files</p>
              </div>
            ) : (
              <>
                <p className="text-neutral-400 mb-2 text-sm sm:text-base px-2">
                  <span className="font-semibold">Drag & drop</span> multiple files from your computer or hit the button below
                </p>
                <p className="text-neutral-500 text-xs mb-4">
                  Supported: JPG, PNG, GIF, PDF, PSD, AI, EPS
                </p>
              </>
            )}
            <input
              type="file"
              id="file-upload"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf,.pdf,.psd,.ai,.eps"
              multiple
            />
            {!isDragOver && (
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-[#fdb913] text-black font-bold rounded hover:bg-[#e5a711] transition-all uppercase tracking-wide cursor-pointer text-sm sm:text-base ${isUploading ? 'opacity-50 cursor-not-allowed' : ''
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
                    <span>Upload Files</span>
                  </>
                )}
              </label>
            )}
          </div>
        </div>

        {/* Search and Filter Skeleton */}
        {isLoadingFiles && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="w-full h-10 bg-neutral-800 rounded-lg animate-pulse"></div>
              </div>
              <div className="w-32 h-4 bg-neutral-700 rounded animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Files Grid */}
        {isLoadingFiles ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square bg-neutral-900 rounded-lg border border-neutral-800 animate-pulse"
              >
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-neutral-700 rounded-lg mb-4"></div>
                  <div className="w-20 h-4 bg-neutral-700 rounded mb-2"></div>
                  <div className="w-16 h-3 bg-neutral-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredFiles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
              {filteredFiles
                .slice((currentPage - 1) * filesPerPage, currentPage * filesPerPage)
                .map((item) => {
                  const isPdf = item.fileName?.toLowerCase().endsWith('.pdf') ||
                    item.fileType?.toLowerCase().includes('pdf') ||
                    item.url?.toLowerCase().endsWith('.pdf');

                  return (
              <div
                key={item.id}
                className="aspect-square bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 hover:border-brand-yellow transition-all group relative cursor-pointer"
              >
                      {isPdf ? (
                        // PDF Thumbnail
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-900/20 to-red-700/10">
                          <div className="text-6xl sm:text-7xl mb-2">📄</div>
                          <div className="px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg">
                            <span className="text-red-400 font-bold text-sm uppercase tracking-wider">PDF</span>
                          </div>
                        </div>
                      ) : (
                        // Image Thumbnail
                        <img
                          src={item.url || "/placeholder.svg"}
                          alt={item.fileName}
                          className="w-full h-full object-contain"
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 sm:p-4">
                        <p className="text-white text-xs sm:text-sm font-semibold truncate">
                          {item.fileName}
                        </p>
                        {isPdf && (
                          <p className="text-red-400 text-xs mt-1">PDF Document</p>
                        )}
                        {!isPdf && previewFileId === item.id && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-400" />
                            <p className="text-yellow-400 text-xs">Preview Image</p>
                          </div>
                        )}
                      </div>
                {/* Mobile: Always visible buttons, Desktop: Show on hover */}
                <div className="absolute top-2 right-2 sm:inset-0 sm:bg-black/60 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-all duration-200 flex flex-row sm:flex-col items-start sm:items-center justify-end sm:justify-center gap-2 p-2 sm:p-3 z-10">
                        <div className="flex flex-row gap-2">
                          {/* Preview Button - Only show for image files */}
                          {!isPdf && (
                            <button
                              onClick={() => handleSetPreview(item.id)}
                              disabled={settingPreview === item.id || previewFileId === item.id}
                              className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded font-semibold transition-colors flex items-center justify-center gap-1 shadow-lg ${
                                previewFileId === item.id 
                                  ? 'bg-yellow-600 text-white cursor-default' 
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              } ${settingPreview === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={previewFileId === item.id ? "Current preview image" : "Set as preview image"}
                            >
                              {settingPreview === item.id ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                              ) : previewFileId === item.id ? (
                                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              ) : (
                                <StarOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              )}
                            </button>
                          )}
                          {reviews.length > 0 && (
                            <Link
                              href={`/admin/review/${reviews[0].shareLink}`}
                              className="px-2 py-1.5 sm:px-3 sm:py-2 bg-[#fdb913] text-black rounded font-semibold hover:bg-[#e5a711] transition-colors text-xs sm:text-sm text-center shadow-lg"
                              title="View client feedback"
                            >
                              <span className="hidden md:inline">Feedback</span>
                              <span className="md:hidden">👁️</span>
                            </Link>
                          )}
                          <button
                            onClick={() => handleDeleteFile(item.id)}
                            disabled={deletingFileId === item.id}
                            className={`px-2 py-1.5 sm:px-3 sm:py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-1 shadow-lg ${deletingFileId === item.id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            title="Delete file"
                          >
                            {deletingFileId === item.id ? (
                              <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <Trash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Pagination Controls */}
            {filteredFiles.length > filesPerPage && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-neutral-400">
                  Page {currentPage} of {Math.ceil(filteredFiles.length / filesPerPage)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.ceil(filteredFiles.length / filesPerPage) }, (_, i) => i + 1)
                      .filter(page => {
                        const totalPages = Math.ceil(filteredFiles.length / filesPerPage)
                        return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && <span className="px-2 text-neutral-500">...</span>}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded transition-colors ${currentPage === page
                                ? 'bg-brand-yellow text-black font-semibold'
                                : 'bg-neutral-800 text-white hover:bg-neutral-700'
                              }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredFiles.length / filesPerPage)))}
                    disabled={currentPage === Math.ceil(filteredFiles.length / filesPerPage)}
                    className="px-3 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : designItems.length > 0 ? (
          <div className="text-center py-8">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 max-w-md mx-auto">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-white mb-2">No files found</h3>
              <p className="text-sm text-neutral-400 mb-4">
                No files match your search criteria
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-brand-yellow text-black rounded font-semibold hover:bg-yellow-500 transition-colors"
              >
                Clear Search
              </button>
            </div>
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
      </div>
     </AdminLayout>
  )
}

