import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { elements } from "./elements";

export const commentTypeEnum = pgEnum('comment_type', ['GENERAL', 'ANNOTATION', 'APPROVAL_REQUEST', 'ADMIN_REPLY']);
export const commentStatusEnum = pgEnum('comment_status', ['ACTIVE', 'RESOLVED', 'ARCHIVED']);

export const comments = pgTable("comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: commentTypeEnum("type").notNull().default("GENERAL"),
  status: commentStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  elementId: text("element_id").notNull().references(() => elements.id, { onDelete: "cascade" }),
  commentText: text("comment_text").notNull(),
  coordinates: text("coordinates"),
  userName: text("user_name").notNull(),
  parentId: text("parent_id").references(() => comments.id, { onDelete: "cascade" }),
});
