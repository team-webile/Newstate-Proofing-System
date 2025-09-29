import { db } from '@/db';
import { approvals, elements, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface CreateApprovalData {
  type: 'ELEMENT' | 'PROJECT';
  elementId?: string;
  projectId?: string;
  signature: string;
  userName: string;
}

export interface UpdateApprovalData {
  signature?: string;
  userName?: string;
}

export class ApprovalModel {
  static async create(data: CreateApprovalData) {
    const [approval] = await db.insert(approvals).values(data).returning();
    return approval;
  }

  static async findById(id: string) {
    const [approval] = await db
      .select({
        id: approvals.id,
        type: approvals.type,
        elementId: approvals.elementId,
        projectId: approvals.projectId,
        approvedAt: approvals.approvedAt,
        signature: approvals.signature,
        userName: approvals.userName,
        element: elements,
        project: projects,
      })
      .from(approvals)
      .leftJoin(elements, eq(approvals.elementId, elements.id))
      .leftJoin(projects, eq(approvals.projectId, projects.id))
      .where(eq(approvals.id, id));
    
    return approval || null;
  }

  static async update(id: string, data: UpdateApprovalData) {
    const [approval] = await db
      .update(approvals)
      .set(data)
      .where(eq(approvals.id, id))
      .returning();
    
    return approval;
  }

  static async delete(id: string) {
    const [approval] = await db.delete(approvals).where(eq(approvals.id, id)).returning();
    return approval;
  }

  static async findByElementId(elementId: string) {
    return await db
      .select()
      .from(approvals)
      .where(eq(approvals.elementId, elementId))
      .orderBy(approvals.approvedAt);
  }

  static async findByProjectId(projectId: string) {
    return await db
      .select()
      .from(approvals)
      .where(eq(approvals.projectId, projectId))
      .orderBy(approvals.approvedAt);
  }
}