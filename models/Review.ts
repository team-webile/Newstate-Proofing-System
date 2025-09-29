import { db } from '@/db';
import { reviews, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface CreateReviewData {
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  projectId: string;
  reviewName: string;
  shareLink: string;
}

export interface UpdateReviewData {
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  reviewName?: string;
}

export class ReviewModel {
  static async create(data: CreateReviewData) {
    const [review] = await db.insert(reviews).values(data).returning();
    return review;
  }

  static async findById(id: string) {
    const [review] = await db
      .select({
        id: reviews.id,
        description: reviews.description,
        status: reviews.status,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        projectId: reviews.projectId,
        reviewName: reviews.reviewName,
        shareLink: reviews.shareLink,
        project: projects,
      })
      .from(reviews)
      .leftJoin(projects, eq(reviews.projectId, projects.id))
      .where(eq(reviews.id, id));
    
    return review || null;
  }

  static async findByShareLink(shareLink: string) {
    const [review] = await db
      .select({
        id: reviews.id,
        description: reviews.description,
        status: reviews.status,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        projectId: reviews.projectId,
        reviewName: reviews.reviewName,
        shareLink: reviews.shareLink,
        project: projects,
      })
      .from(reviews)
      .leftJoin(projects, eq(reviews.projectId, projects.id))
      .where(eq(reviews.shareLink, shareLink));
    
    return review || null;
  }

  static async update(id: string, data: UpdateReviewData) {
    const [review] = await db
      .update(reviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    
    return review;
  }

  static async delete(id: string) {
    const [review] = await db.delete(reviews).where(eq(reviews.id, id)).returning();
    return review;
  }

  static async findByProjectId(projectId: string) {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.projectId, projectId))
      .orderBy(reviews.createdAt);
  }
}