import { PrismaClient } from '@prisma/client'

// Global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database query helpers using Prisma
export async function getProjects(archived = false) {
  return await prisma.project.findMany({
    where: { archived },
    orderBy: { createdAt: 'desc' },
    include: {
      reviews: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function getProjectById(id: number) {
  return await prisma.project.findUnique({
    where: { id },
    include: {
      reviews: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function createProject(data: {
  projectNumber: string
  name: string
  description?: string
  clientEmail?: string
  downloadEnabled?: boolean
  archived?: boolean
}) {
  return await prisma.project.create({
    data: {
      projectNumber: data.projectNumber,
    name: data.name,
    description: data.description || "",
      clientEmail: data.clientEmail || "",
      downloadEnabled: data.downloadEnabled || false,
    archived: data.archived || false,
    },
  })
}

export async function updateProject(id: number, data: {
  projectNumber?: string
  name?: string
  description?: string
  clientEmail?: string
  downloadEnabled?: boolean
  archived?: boolean
}) {
  return await prisma.project.update({
    where: { id },
    data: {
      projectNumber: data.projectNumber,
      name: data.name,
      description: data.description,
      clientEmail: data.clientEmail,
      downloadEnabled: data.downloadEnabled,
      archived: data.archived,
    },
  })
}

export async function getReviewsByProjectId(projectId: number) {
  return await prisma.review.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: {
      designItems: {
        orderBy: { orderIndex: 'asc' },
      },
      approvals: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function getReviewByShareLink(shareLink: string) {
  return await prisma.review.findUnique({
    where: { shareLink },
    include: {
      project: true,
      designItems: {
        orderBy: { orderIndex: 'asc' },
      },
      approvals: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function getDesignItemsByReviewId(reviewId: number) {
  return await prisma.designItem.findMany({
    where: { reviewId },
    orderBy: { orderIndex: 'asc' },
    include: {
      annotations: {
        orderBy: { createdAt: 'asc' },
      },
      comments: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}


export async function createDesignItem(data: {
  reviewId: number
  fileUrl: string
  fileName: string
  fileType?: string
  fileSize?: number
  version?: number
  orderIndex?: number
}) {
  return await prisma.designItem.create({
    data: {
      reviewId: data.reviewId,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileType: data.fileType || 'application/octet-stream',
      fileSize: data.fileSize || 0,
    version: data.version || 1,
      orderIndex: data.orderIndex || 0,
    },
  })
}

export async function createApproval(data: {
  reviewId: number
  firstName: string
  lastName: string
  decision: string
  notes?: string
}) {
  // Start a transaction to create approval and update review status
  return await prisma.$transaction(async (tx) => {
    // Create the approval
    const approval = await tx.approval.create({
      data: {
        reviewId: data.reviewId,
        firstName: data.firstName,
        lastName: data.lastName,
        decision: data.decision as 'APPROVED' | 'REVISION_REQUESTED',
    notes: data.notes || "",
      },
    })

    // Update review status based on decision
    const newStatus = data.decision === "approved" ? 'APPROVED' : 'REVISION_REQUESTED'
    await tx.review.update({
      where: { id: data.reviewId },
      data: { status: newStatus },
    })

    return approval
  })
}

export async function searchProjects(query: string) {
  return await prisma.project.findMany({
    where: {
      archived: false,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { projectNumber: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      reviews: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function getActivityLogs(projectId?: number) {
  if (projectId) {
    return await prisma.activityLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })
  }
  
  return await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100, // Limit to recent 100 logs
  })
}

export async function createActivityLog(data: {
  projectId: number
  userName: string
  action: string
  details: string
}) {
  return await prisma.activityLog.create({
    data: {
      projectId: data.projectId,
      userName: data.userName,
    action: data.action,
    details: data.details,
    },
  })
}


export async function getApprovalsByReviewId(reviewId: number) {
  return await prisma.approval.findMany({
    where: { reviewId },
    orderBy: { createdAt: 'desc' },
  })
}

// Additional helper functions for annotations and comments
export async function createAnnotation(data: {
  designItemId: number
  xPosition: number
  yPosition: number
  content: string
}) {
  return await prisma.annotation.create({
    data: {
      designItemId: data.designItemId,
      xPosition: data.xPosition,
      yPosition: data.yPosition,
      content: data.content,
    },
  })
}

export async function getAnnotationsByDesignItemId(designItemId: number) {
  return await prisma.annotation.findMany({
    where: { designItemId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createComment(data: {
  designItemId: number
  authorName?: string
  content: string
}) {
  return await prisma.comment.create({
    data: {
      designItemId: data.designItemId,
      authorName: data.authorName || "",
      content: data.content,
    },
  })
}

export async function getCommentsByDesignItemId(designItemId: number) {
  return await prisma.comment.findMany({
    where: { designItemId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createReview(data: {
  projectId: number
  shareLink: string
  status?: string
}) {
  return await prisma.review.create({
    data: {
      projectId: data.projectId,
      shareLink: data.shareLink,
      status: data.status || 'PENDING',
    },
  })
}          

export async function deleteDesignItem(id: number) {
  return await prisma.designItem.delete({
    where: { id },
  })
}
