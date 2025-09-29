import { db } from '@/db';
import { comments, elements } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface CreateCommentData {
  type?: 'GENERAL' | 'ANNOTATION' | 'APPROVAL_REQUEST' | 'ADMIN_REPLY';
  status?: 'ACTIVE' | 'RESOLVED' | 'ARCHIVED';
  elementId: string;
  commentText: string;
  coordinates?: string;
  userName: string;
  parentId?: string;
}

export interface UpdateCommentData {
  type?: 'GENERAL' | 'ANNOTATION' | 'APPROVAL_REQUEST' | 'ADMIN_REPLY';
  status?: 'ACTIVE' | 'RESOLVED' | 'ARCHIVED';
  commentText?: string;
  coordinates?: string;
  userName?: string;
}

export class CommentModel {
  static async create(data: CreateCommentData) {
    const [comment] = await db.insert(comments).values(data).returning();
    return comment;
  }

  static async findById(id: string) {
    const [comment] = await db
      .select({
        id: comments.id,
        type: comments.type,
        status: comments.status,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        elementId: comments.elementId,
        commentText: comments.commentText,
        coordinates: comments.coordinates,
        userName: comments.userName,
        parentId: comments.parentId,
        element: elements,
      })
      .from(comments)
      .leftJoin(elements, eq(comments.elementId, elements.id))
      .where(eq(comments.id, id));
    
    return comment || null;
  }

  static async update(id: string, data: UpdateCommentData) {
    const [comment] = await db
      .update(comments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    
    return comment;
  }

  static async delete(id: string) {
    const [comment] = await db.delete(comments).where(eq(comments.id, id)).returning();
    return comment;
  }

  static async findByElementId(elementId: string) {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.elementId, elementId))
      .orderBy(comments.createdAt);
  }

  static async findReplies(parentId: string) {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.parentId, parentId))
      .orderBy(comments.createdAt);
  }
}