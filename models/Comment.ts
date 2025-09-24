import { Comment as PrismaComment, CommentType, CommentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface CreateCommentData {
  commentText: string;
  coordinates?: string;
  type?: CommentType;
  status?: CommentStatus;
  elementId: string;
  userName: string;
  parentId?: string;
}

export interface UpdateCommentData {
  commentText?: string;
  coordinates?: string;
  type?: CommentType;
  status?: CommentStatus;
  userName?: string;
  parentId?: string;
}

export class CommentModel {
  static async create(data: CreateCommentData): Promise<any> {
    return await prisma.comment.create({
      data: data as any,
    });
  }

  static async findById(id: string): Promise<PrismaComment | null> {
    return await prisma.comment.findUnique({
      where: { id },
    });
  }

  static async findByElementId(elementId: string): Promise<any[]> {
    return await prisma.comment.findMany({
      where: { 
        elementId,
        parentId: null // Only get top-level comments
      } as any,
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      } as any,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async update(id: string, data: UpdateCommentData): Promise<PrismaComment> {
    return await prisma.comment.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<PrismaComment> {
    return await prisma.comment.delete({
      where: { id },
    });
  }

  static async updateStatus(id: string, status: CommentStatus): Promise<PrismaComment> {
    return await prisma.comment.update({
      where: { id },
      data: { status },
    });
  }

  static async findByType(type: CommentType): Promise<PrismaComment[]> {
    return await prisma.comment.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
      include: {
        element: {
          include: {
            review: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });
  }

  static async findAll(): Promise<any[]> {
    return await prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        element: {
          include: {
            review: {
              include: {
                project: true,
              },
            },
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      } as any,
    });
  }

  static async createReply(parentId: string, data: Omit<CreateCommentData, 'parentId'>): Promise<any> {
    return await prisma.comment.create({
      data: {
        ...data,
        parentId,
      } as any,
    });
  }

  static async getCommentsWithReplies(elementId: string): Promise<any[]> {
    return await prisma.comment.findMany({
      where: { 
        elementId,
        parentId: null 
      } as any,
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      } as any,
      orderBy: { createdAt: 'desc' },
    });
  }
}

export { CommentType, CommentStatus };
