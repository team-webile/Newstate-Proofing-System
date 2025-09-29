import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const annotationStatusEnum = pgEnum('annotation_status', ['PENDING', 'COMPLETED', 'REJECTED']);

export const annotations = pgTable("annotations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text("content").notNull(),
  fileId: text("fileId").notNull(),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  addedBy: text("addedBy").notNull(),
  addedByName: text("addedByName"),
  coordinates: text("coordinates"),
  isResolved: boolean("isResolved").notNull().default(false),
  status: annotationStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
