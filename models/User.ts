import { User as PrismaUser, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
}

export class UserModel {
  static async create(data: CreateUserData): Promise<PrismaUser> {
    return await prisma.user.create({
      data,
    });
  }

  static async findById(id: string): Promise<PrismaUser | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  static async findByEmail(email: string): Promise<PrismaUser | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  static async update(id: string, data: UpdateUserData): Promise<PrismaUser> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<PrismaUser> {
    return await prisma.user.delete({
      where: { id },
    });
  }

  static async findAll(): Promise<PrismaUser[]> {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findWithProjects(id: string): Promise<PrismaUser | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        projects: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}

export { UserRole };
