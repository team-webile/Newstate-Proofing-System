import { Approval as PrismaApproval, ApprovalType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface CreateApprovalData {
  type: ApprovalType;
  elementId?: string;
  projectId?: string;
  signature: string;
  userName: string;
}

export interface UpdateApprovalData {
  type?: ApprovalType;
  signature?: string;
  userName?: string;
}

export class ApprovalModel {
  static async create(data: CreateApprovalData): Promise<PrismaApproval> {
    return await prisma.approval.create({
      data,
    });
  }

  static async findById(id: string): Promise<PrismaApproval | null> {
    return await prisma.approval.findUnique({
      where: { id },
    });
  }

  static async findByElementId(elementId: string): Promise<PrismaApproval[]> {
    return await prisma.approval.findMany({
      where: { elementId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findByProjectId(projectId: string): Promise<PrismaApproval[]> {
    return await prisma.approval.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async update(id: string, data: UpdateApprovalData): Promise<PrismaApproval> {
    return await prisma.approval.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<PrismaApproval> {
    return await prisma.approval.delete({
      where: { id },
    });
  }

  static async findByType(type: ApprovalType): Promise<PrismaApproval[]> {
    return await prisma.approval.findMany({
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
        project: true,
      },
    });
  }

  static async findAll(): Promise<PrismaApproval[]> {
    return await prisma.approval.findMany({
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
        project: true,
      },
    });
  }
}

export { ApprovalType };
