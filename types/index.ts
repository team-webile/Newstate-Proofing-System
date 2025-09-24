export interface ProjectWithReviews {
  id: string
  clientName: string
  clientEmail?: string
  description?: string
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'
  downloadEnabled: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
  reviews?: ReviewWithElements[]
  _count?: {
    reviews: number
    approvals: number
  }
}

export interface ReviewWithElements {
  id: string
  name: string
  description?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED'
  createdAt: Date
  updatedAt: Date
  elements: ElementWithVersions[]
}

export interface ElementWithVersions {
  id: string
  name: string
  description?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'
  createdAt: Date
  updatedAt: Date
  versions: ElementVersion[]
  comments: Comment[]
}

export interface ElementVersion {
  id: string
  version: number
  filename: string
  filePath: string
  fileSize: number
  mimeType: string
  createdAt: Date
}

export interface Comment {
  id: string
  content: string
  x?: number
  y?: number
  type: 'GENERAL' | 'ANNOTATION' | 'APPROVAL_REQUEST'
  status: 'ACTIVE' | 'RESOLVED' | 'ARCHIVED'
  createdAt: Date
  updatedAt: Date
}

export interface Approval {
  id: string
  firstName: string
  lastName: string
  type: 'ELEMENT' | 'PROJECT'
  createdAt: Date
}

export interface CreateProjectData {
  name: string
  clientName: string
  clientEmail?: string
  description?: string
  allowDownloads?: boolean
}

export interface CreateReviewData {
  name: string
  description?: string
  projectId: string
}

export interface CreateElementData {
  name: string
  description?: string
  reviewId: string
}

export interface UploadFileData {
  file: File
  elementId: string
}

export interface CreateCommentData {
  content: string
  x?: number
  y?: number
  type: 'GENERAL' | 'ANNOTATION' | 'APPROVAL_REQUEST'
  elementId: string
}

export interface CreateApprovalData {
  firstName: string
  lastName: string
  type: 'ELEMENT' | 'PROJECT'
  elementId?: string
  projectId?: string
}
