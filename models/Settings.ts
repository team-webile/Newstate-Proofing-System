import { db } from "@/db";
import { settings, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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
    const [newSettings] = await db
      .insert(settings)
      .values({
        userId: data.userId,
        approvalMessage: data.approvalMessage || "Thank you for your approval!",
        signatureMessage:
          data.signatureMessage ||
          "By signing below, I approve this design element.",
        companyName: data.companyName || "New State Branding",
        themeMode: data.themeMode || "system",
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        borderRadius: data.borderRadius || "0.625rem",
        fontFamily: data.fontFamily || "Inter",
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        customCss: data.customCss,
      })
      .returning();
    return newSettings;
  }

  static async findById(id: string): Promise<any | null> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.id, id));
    return setting || null;
  }

  static async findByUserId(userId: string): Promise<any | null> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId));
    return setting || null;
  }

  static async update(id: string, data: UpdateSettingsData): Promise<any> {
    const [updatedSettings] = await db
      .update(settings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(settings.id, id))
      .returning();
    return updatedSettings;
  }

  static async updateByUserId(
    userId: string,
    data: UpdateSettingsData
  ): Promise<any> {
    // First try to find existing settings
    const existingSettings = await this.findByUserId(userId);

    if (existingSettings) {
      // Update existing settings
      return await this.update(existingSettings.id, data);
    } else {
      // Create new settings if none exist
      return await this.create({
        userId,
        ...data,
      });
    }
  }

  static async delete(id: string): Promise<any> {
    const [deletedSettings] = await db
      .delete(settings)
      .where(eq(settings.id, id))
      .returning();
    return deletedSettings;
  }

  static async findAll(): Promise<any[]> {
    return await db
      .select({
        id: settings.id,
        approvalMessage: settings.approvalMessage,
        signatureMessage: settings.signatureMessage,
        companyName: settings.companyName,
        themeMode: settings.themeMode,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        accentColor: settings.accentColor,
        borderRadius: settings.borderRadius,
        fontFamily: settings.fontFamily,
        logoUrl: settings.logoUrl,
        faviconUrl: settings.faviconUrl,
        customCss: settings.customCss,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
        userId: settings.userId,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
        },
      })
      .from(settings)
      .leftJoin(users, eq(settings.userId, users.id))
      .orderBy(desc(settings.createdAt));
  }
}
