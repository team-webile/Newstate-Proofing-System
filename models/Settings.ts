// import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface CreateSettingsData {
  userId: string;
  approvalMessage?: string;
  signatureMessage?: string;
  companyName?: string;
  themeMode?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
}

export interface UpdateSettingsData {
  approvalMessage?: string;
  signatureMessage?: string;
  companyName?: string;
  themeMode?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
}

export class SettingsModel {
  static async create(data: CreateSettingsData): Promise<any> {
    return await prisma.settings.create({
      data: {
        userId: data.userId,
        approvalMessage: data.approvalMessage || 'Thank you for your approval!',
        signatureMessage: data.signatureMessage || 'By signing below, I approve this design element.',
        companyName: data.companyName || 'New State Branding',
        themeMode: data.themeMode || 'system',
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        borderRadius: data.borderRadius || '0.625rem',
        fontFamily: data.fontFamily || 'Inter',
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        customCss: data.customCss
      },
    });
  }

  static async findById(id: string): Promise<any | null> {
    return await prisma.settings.findUnique({
      where: { id },
    });
  }

  static async findByUserId(userId: string): Promise<any | null> {
    return await prisma.settings.findFirst({
      where: { userId },
    });
  }

  static async update(id: string, data: UpdateSettingsData): Promise<any> {
    return await prisma.settings.update({
      where: { id },
      data,
    });
  }

  static async updateByUserId(userId: string, data: UpdateSettingsData): Promise<any> {
    // First try to find existing settings
    let settings = await prisma.settings.findFirst({
      where: { userId },
    });

    if (settings) {
      // Update existing settings
      return await prisma.settings.update({
        where: { id: settings.id },
        data,
      });
    } else {
      // Create new settings if none exist
      return await prisma.settings.create({
        data: {
          userId,
          approvalMessage: data.approvalMessage || 'Thank you for your approval!',
          signatureMessage: data.signatureMessage || 'By signing below, I approve this design element.',
          companyName: data.companyName || 'New State Branding',
          themeMode: data.themeMode || 'system',
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          accentColor: data.accentColor,
          borderRadius: data.borderRadius || '0.625rem',
          fontFamily: data.fontFamily || 'Inter',
          logoUrl: data.logoUrl,
          faviconUrl: data.faviconUrl,
          customCss: data.customCss
        },
      });
    }
  }

  static async delete(id: string): Promise<any> {
    return await prisma.settings.delete({
      where: { id },
    });
  }

  static async findAll(): Promise<any[]> {
    return await prisma.settings.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      },
    });
  }
}
