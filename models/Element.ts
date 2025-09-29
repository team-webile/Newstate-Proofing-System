import { db } from '@/db';
import { elements, reviews } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface CreateElementData {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  reviewId: string;
  elementName: string;
  filePath: string;
  version?: number;
}

export interface UpdateElementData {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  elementName?: string;
  filePath?: string;
  version?: number;
}

export class ElementModel {
  static async create(data: CreateElementData) {
    const [element] = await db.insert(elements).values(data).returning();
    return element;
  }

  static async findById(id: string) {
    const [element] = await db
      .select({
        id: elements.id,
        status: elements.status,
        createdAt: elements.createdAt,
        updatedAt: elements.updatedAt,
        reviewId: elements.reviewId,
        elementName: elements.elementName,
        filePath: elements.filePath,
        version: elements.version,
        review: reviews,
      })
      .from(elements)
      .leftJoin(reviews, eq(elements.reviewId, reviews.id))
      .where(eq(elements.id, id));
    
    return element || null;
  }

  static async update(id: string, data: UpdateElementData) {
    const [element] = await db
      .update(elements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(elements.id, id))
      .returning();
    
    return element;
  }

  static async delete(id: string) {
    const [element] = await db.delete(elements).where(eq(elements.id, id)).returning();
    return element;
  }

  static async findByReviewId(reviewId: string) {
    return await db
      .select()
      .from(elements)
      .where(eq(elements.reviewId, reviewId))
      .orderBy(elements.createdAt);
  }
}