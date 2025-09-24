import { Review as PrismaReview, ReviewStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface CreateReviewData {
  reviewName: string;
  description?: string;
  status?: ReviewStatus;
  projectId: string;
  shareLink: string;
  updatedAt: Date;
}

export interface UpdateReviewData {
  reviewName?: string;
  description?: string;
  status?: ReviewStatus;
}

export class ReviewModel {
  static async create(data: CreateReviewData): Promise<PrismaReview> {
    return await prisma.review.create({
      data,
    });
  }

  static async findById(id: string): Promise<PrismaReview | null> {
    return await prisma.review.findUnique({
      where: { id },
    });
  }

  static async findByProjectId(projectId: string): Promise<PrismaReview[]> {
    return await prisma.review.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findByProjectIdFirst(projectId: string): Promise<PrismaReview | null> {
    return await prisma.review.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async update(id: string, data: UpdateReviewData): Promise<PrismaReview> {
    return await prisma.review.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<PrismaReview> {
    return await prisma.review.delete({
      where: { id },
    });
  }

  static async findWithElements(id: string): Promise<PrismaReview | null> {
    return await prisma.review.findUnique({
      where: { id },
      include: {
        project: true,
        elements: {
          include: {
            versions: true,
            comments: true,
            approvals: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  static async updateStatus(id: string, status: ReviewStatus): Promise<PrismaReview> {
    return await prisma.review.update({
      where: { id },
      data: { status },
    });
  }

  static async findAll(): Promise<PrismaReview[]> {
    return await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        project: true,
        _count: {
          select: {
            elements: true,
          },
        },
      },
    });
  }

  static async findByShareLink(shareLink: string): Promise<any> {
    return await prisma.review.findUnique({
      where: { shareLink },
      include: {
        project: {
          include: {
            user: true,
          },
        },
        elements: {
          include: {
            versions: {
              orderBy: { version: 'desc' },
            },
            comments: {
              where: { status: 'ACTIVE' },
              orderBy: { createdAt: 'desc' },
            },
            approvals: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}

export { ReviewStatus };
