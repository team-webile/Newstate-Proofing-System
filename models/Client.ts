import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq, or, like, and, desc, count } from 'drizzle-orm';

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
  static async create(data: CreateClientData) {
    const [client] = await db.insert(clients).values(data).returning();
    return client;
  }

  static async findById(id: string) {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || null;
  }

  static async findByEmail(email: string) {
    const [client] = await db.select().from(clients).where(eq(clients.email, email));
    return client || null;
  }

  static async update(id: string, data: UpdateClientData) {
    const [client] = await db
      .update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    
    return client;
  }

  static async delete(id: string) {
    const [client] = await db.delete(clients).where(eq(clients.id, id)).returning();
    return client;
  }

  static async findAll() {
    return await db.select().from(clients).orderBy(clients.createdAt);
  }

  static async findWithPagination(options: {
    page: number;
    limit: number;
    offset: number;
    search: string;
  }) {
    const { page, limit, offset, search } = options;
    
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          like(clients.name, `%${search}%`),
          like(clients.email, `%${search}%`),
          like(clients.company, `%${search}%`)
        )
      );
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    const [clientResults, totalCount] = await Promise.all([
      db
        .select()
        .from(clients)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(clients.createdAt)),
      
      db.select({ count: count() }).from(clients).where(whereClause)
    ]);
    
    const total = totalCount[0]?.count || 0;
    
    return {
      clients: clientResults,
      total,
    };
  }

  static async findWithProjects(id: string) {
    // This would need to be implemented with proper joins
    // For now, return the client
    return await this.findById(id);
  }
}