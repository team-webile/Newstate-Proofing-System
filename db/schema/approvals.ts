import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { elements } from "./elements";
import { projects } from "./projects";

export const approvalTypeEnum = pgEnum('approval_type', ['ELEMENT', 'PROJECT']);

export const approvals = pgTable("approvals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: approvalTypeEnum("type").notNull(),
  elementId: text("elementId").references(() => elements.id, { onDelete: "cascade" }),
  projectId: text("projectId").references(() => projects.id, { onDelete: "cascade" }),
  approvedAt: timestamp("approvedAt").notNull().defaultNow(),
  signature: text("signature").notNull(),
  userName: text("userName").notNull(),
});
