import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const reviewStatusEnum = pgEnum('review_status', ['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED']);

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  description: text("description"),
  status: reviewStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  reviewName: text("reviewName").notNull(),
  shareLink: text("shareLink").notNull().unique(),
});
