'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import AdminLayout from '../components/AdminLayout'
import { 
  Search, 
  Eye, 
  Calendar,
  Mail,
  FileText,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface Review {
  id: number
  shareLink: string
  status: string
  createdAt: string
  updatedAt: string
  project: {
    id: number
    name: string
    projectNumber: string
    clientEmail: string
  }
  approvals: any[]
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    loadReviews()
  }, [])

  useEffect(() => {
    filterReviews()
  }, [reviews, searchQuery, statusFilter])

  const loadReviews = async () => {
    try {
      // Fetch all projects with their reviews
      const response = await fetch('/api/projects')
      if (response.ok) {
        const projects = await response.json()
        // Flatten reviews from all projects
        const allReviews = projects.flatMap((project: any) => 
          (project.reviews || []).map((review: any) => ({
            ...review,
            project: {
              id: project.id,
              name: project.name,
              projectNumber: project.projectNumber,
              clientEmail: project.clientEmail
            }
          }))
        )
        setReviews(allReviews)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterReviews = () => {
    let filtered = reviews

    if (statusFilter !== 'all') {
      filtered = filtered.filter(review => review.status === statusFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(review =>
        review.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.project.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.project.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.shareLink.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredReviews(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-900/30 text-green-300 border-green-800'
      case 'PENDING': return 'bg-yellow-900/30 text-yellow-300 border-yellow-800'
      case 'REVISION_REQUESTED': return 'bg-red-900/30 text-red-300 border-red-800'
      default: return 'bg-gray-900/30 text-gray-300 border-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />
      case 'PENDING': return <Clock className="h-4 w-4" />
      case 'REVISION_REQUESTED': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <AdminLayout title="Reviews" description="Manage and monitor all reviews" icon={<FileText className="h-8 w-8 text-brand-yellow" />}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-2 text-gray-300">Loading reviews...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Reviews" description="Manage and monitor all reviews" icon={<FileText className="h-8 w-8 text-brand-yellow" />}>
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">All Reviews</h1>
          <p className="text-neutral-400">Monitor client feedback and review status</p>
        </div>

        {/* Controls */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-neutral-900 border-neutral-700 text-white placeholder-neutral-400 w-64 focus:border-brand-yellow focus:ring-brand-yellow/20"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 text-white px-3 py-2 rounded focus:border-brand-yellow focus:ring-brand-yellow/20"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REVISION_REQUESTED">Revision Requested</option>
              </select>
            </div>
          </div>

        
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 hover:shadow-lg hover:shadow-brand-yellow/10 transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg group-hover:text-brand-yellow transition-colors">{review.project.name}</CardTitle>
                    <CardDescription className="text-neutral-400 font-mono text-sm">{review.project.projectNumber}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-neutral-400 hover:text-brand-yellow hover:bg-neutral-800">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-900 border-neutral-700">
                      <DropdownMenuItem 
                        onClick={() => window.open(`/review/${review.shareLink}`, '_blank')}
                        className="text-neutral-300 hover:bg-neutral-800 hover:text-brand-yellow focus:bg-neutral-800 focus:text-brand-yellow"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Review
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-neutral-400 text-sm">
                  <Mail className="h-4 w-4 text-brand-yellow/70" />
                  <span className="truncate">{review.project.clientEmail}</span>
                </div>

                <div className="flex items-center space-x-2 text-neutral-400 text-sm">
                  <Calendar className="h-4 w-4 text-brand-yellow/70" />
                  <span>Created {formatDate(review.createdAt)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(review.status)} flex items-center gap-2`}
                  >
                    {getStatusIcon(review.status)}
                    {review.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/review/${review.shareLink}`, '_blank')}
                    className="flex-1 border-neutral-600 text-neutral-300 hover:bg-brand-yellow hover:text-black hover:border-brand-yellow transition-colors bg-neutral-900"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 max-w-md mx-auto">
              <FileText className="h-16 w-16 text-brand-yellow mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-white mb-3">No reviews found</h3>
              <p className="text-neutral-400 mb-6 leading-relaxed">
                {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search terms or filters.' : 'No reviews have been created yet.'}
              </p>
              <Button 
                onClick={() => router.push('/admin/projects')}
                className="bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold px-6 py-2"
              >
                <FileText className="h-4 w-4 mr-2" />
                Go to Projects
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
