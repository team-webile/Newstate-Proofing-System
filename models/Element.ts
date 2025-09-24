import { Element as PrismaElement, ElementStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface CreateElementData {
  elementName: string;
  filePath: string;
  version: number;
  status?: ElementStatus;
  reviewId: string;
  versions?: Array<{
    version: number;
    filename: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
  }>;
}

export interface UpdateElementData {
  elementName?: string;
  filePath?: string;
  version?: number;
  status?: ElementStatus;
}

export class ElementModel {
  static async create(data: CreateElementData): Promise<PrismaElement> {
    return await prisma.element.create({
      data,
    });
  }

  static async findById(id: string): Promise<PrismaElement | null> {
    return await prisma.element.findUnique({
      where: { id },
    });
  }

  static async findByReviewId(reviewId: string): Promise<PrismaElement[]> {
    return await prisma.element.findMany({
      where: { reviewId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async update(id: string, data: UpdateElementData): Promise<PrismaElement> {
    return await prisma.element.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<PrismaElement> {
    return await prisma.element.delete({
      where: { id },
    });
  }

  static async findWithDetails(id: string): Promise<PrismaElement | null> {
    return await prisma.element.findUnique({
      where: { id },
      include: {
        review: {
          include: {
            project: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
        },
        approvals: true,
      },
    });
  }

  static async updateStatus(id: string, status: ElementStatus): Promise<PrismaElement> {
    return await prisma.element.update({
      where: { id },
      data: { status },
    });
  }

  static async findAll(): Promise<PrismaElement[]> {
    return await prisma.element.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        review: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
        versions: {
          orderBy: { version: 'desc' },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
        },
        approvals: true,
        _count: {
          select: {
            versions: true,
            comments: true,
            approvals: true,
          },
        },
      },
    });
  }

  static async findByProjectId(projectId: string): Promise<PrismaElement[]> {
    return await prisma.element.findMany({
      where: {
        review: {
          projectId: projectId,
        },
      },
      include: {
        review: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
        versions: {
          orderBy: { version: 'desc' },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
        },
        approvals: true,
        _count: {
          select: {
            versions: true,
            comments: true,
            approvals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export { ElementStatus };
