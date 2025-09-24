import { Client as PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
}

export class ClientModel {
  static async create(data: CreateClientData): Promise<PrismaClient> {
    return await prisma.client.create({
      data,
    });
  }

  static async findById(id: string): Promise<PrismaClient | null> {
    return await prisma.client.findUnique({
      where: { id },
    });
  }

  static async findByEmail(email: string): Promise<PrismaClient | null> {
    return await prisma.client.findUnique({
      where: { email },
    });
  }

  static async update(id: string, data: UpdateClientData): Promise<PrismaClient> {
    return await prisma.client.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<PrismaClient> {
    return await prisma.client.delete({
      where: { id },
    });
  }

  static async findAll(): Promise<PrismaClient[]> {
    return await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findWithProjects(id: string): Promise<PrismaClient | null> {
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

  static async search(query: string): Promise<PrismaClient[]> {
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
}
