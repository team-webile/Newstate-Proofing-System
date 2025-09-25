import { prisma } from '@/lib/prisma';

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  logoUrl?: string;
  brandColor?: string;
  themeMode?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  logoUrl?: string;
  brandColor?: string;
  themeMode?: string;
}

export class ClientModel {
  static async create(data: CreateClientData): Promise<any> {
    return await prisma.client.create({
      data,
    });
  }

  static async findById(id: string): Promise<any | null> {
    return await prisma.client.findUnique({
      where: { id },
    });
  }

  static async findByEmail(email: string): Promise<any | null> {
    return await prisma.client.findUnique({
      where: { email },
    });
  }

  static async update(id: string, data: UpdateClientData): Promise<any> {
    return await prisma.client.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<any> {
    return await prisma.client.delete({
      where: { id },
    });
  }

  static async findAll(): Promise<any[]> {
    return await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findWithProjects(id: string): Promise<any | null> {
    return await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
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
        },
      },
    });
  }

  static async search(query: string): Promise<any[]> {
    return await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findWithPagination(params: {
    page: number;
    limit: number;
    offset: number;
    search?: string;
  }): Promise<{ clients: any[]; total: number }> {
    const { page, limit, offset, search } = params;
    
    // Build where clause for search
    const whereClause = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    // Get total count
    const total = await prisma.client.count({
      where: whereClause,
    });

    // Get paginated clients
    const clients = await prisma.client.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    return { clients, total };
  }
}
