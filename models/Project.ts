import { Project as PrismaProject, ProjectStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface CreateProjectData {
  title: string;
  description?: string;
  status?: ProjectStatus;
  downloadEnabled?: boolean;
  userId: string;
  clientId: string;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  downloadEnabled?: boolean;
  clientId?: string;
}

export class ProjectModel {
  static async create(data: CreateProjectData): Promise<PrismaProject> {
    return await prisma.project.create({
      data,
    });
  }

  static async findById(id: string): Promise<PrismaProject | null> {
    return await prisma.project.findUnique({
      where: { id },
    });
  }


  static async findByUserId(userId: string): Promise<PrismaProject[]> {
    return await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        _count: {
          select: {
            reviews: true,
            approvals: true,
          },
        },
      },
    });
  }

  static async update(id: string, data: UpdateProjectData): Promise<PrismaProject> {
    return await prisma.project.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<PrismaProject> {
    return await prisma.project.delete({
      where: { id },
    });
  }

  static async findAll(): Promise<PrismaProject[]> {
    return await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        client: true,
        _count: {
          select: {
            reviews: true,
            approvals: true,
          },
        },
      },
    });
  }

  static async findWithDetails(id: string): Promise<PrismaProject | null> {
    return await prisma.project.findUnique({
      where: { id },
      include: {
        user: true,
        client: true,
        reviews: {
          include: {
            elements: {
              include: {
                versions: true,
                comments: true,
                approvals: true,
              },
            },
          },
        },
        approvals: true,
      },
    });
  }

  static async updateStatus(id: string, status: ProjectStatus): Promise<PrismaProject> {
    return await prisma.project.update({
      where: { id },
      data: { status },
    });
  }

  static async findByClientId(clientId: string): Promise<PrismaProject[]> {
    return await prisma.project.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        _count: {
          select: {
            reviews: true,
            approvals: true,
          },
        },
      },
    });
  }
}

export { ProjectStatus };
