import Link from "next/link"
import { ExternalLink, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface Review {
  id: number
  share_link: string
  status: string
  created_at: string
}

interface ReviewsListProps {
  reviews: Review[]
  projectNumber: string
}

export function ReviewsList({ reviews, projectNumber }: ReviewsListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "revision_requested":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-neutral-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved"
      case "revision_requested":
        return "Revision Requested"
      default:
        return "Pending Review"
    }
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg hover:bg-neutral-750 transition-colors"
        >
          <div className="flex items-center gap-4">
            {getStatusIcon(review.status)}
            <div>
              <p className="font-medium">{getStatusText(review.status)}</p>
              <p className="text-sm text-neutral-400">Created {new Date(review.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <code className="px-3 py-1 bg-neutral-900 rounded text-sm text-neutral-300">{review.share_link}</code>
            <Link
              href={`/review/${review.share_link}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-brand-yellow text-black font-semibold rounded hover:bg-brand-yellow-hover transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
