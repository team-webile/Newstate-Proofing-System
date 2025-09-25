import { Project as PrismaProject, ProjectStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface CreateProjectData {
  title: string;
  description?: string;
  status?: ProjectStatus;
  downloadEnabled?: boolean;
  emailNotifications?: boolean;
  userId: string;
  clientId: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  customCss?: string;
  logoUrl?: string;
  themeMode?: string;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  downloadEnabled?: boolean;
  clientId?: string;
  emailNotifications?: boolean;
  lastActivity?: Date;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  customCss?: string;
  logoUrl?: string;
  themeMode?: string;
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
      include: {
        client: true,
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

  static async findWithPagination(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string
  ): Promise<{
    projects: PrismaProject[];
    total: number;
    statusCounts: {
      all: number;
      active: number;
      archived: number;
      completed: number;
    };
  }> {
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    // Get projects with pagination
    const [projects, total, statusCounts] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
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
      }),
      prisma.project.count({ where }),
      prisma.project.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    // Format status counts
    const formattedStatusCounts = {
      all: total,
      active: 0,
      archived: 0,
      completed: 0,
    };

    statusCounts.forEach(({ status, _count }) => {
      switch (status) {
        case 'ACTIVE':
          formattedStatusCounts.active = _count.status;
          break;
        case 'ARCHIVED':
          formattedStatusCounts.archived = _count.status;
          break;
        case 'COMPLETED':
          formattedStatusCounts.completed = _count.status;
          break;
      }
    });

    return {
      projects,
      total,
      statusCounts: formattedStatusCounts,
    };
  }
}

export { ProjectStatus };
