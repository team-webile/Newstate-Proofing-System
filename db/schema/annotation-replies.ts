import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { annotations } from "./annotations";
import { projects } from "./projects";

export const annotationReplies = pgTable("annotation_replies", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text("content").notNull(),
  annotationId: text("annotationId").notNull().references(() => annotations.id, { onDelete: "cascade" }),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  addedBy: text("addedBy").notNull(),
  addedByName: text("addedByName"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  isEdited: timestamp("isEdited"),
});
