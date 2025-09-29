import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const versionStatusEnum = pgEnum('version_status', ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']);

export const versions = pgTable("versions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  version: text("version").notNull(),
  description: text("description"),
  status: versionStatusEnum("status").notNull().default("DRAFT"),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  approvedBy: text("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  rejectedBy: text("rejectedBy"),
  rejectedAt: timestamp("rejectedAt"),
  clientFeedback: text("clientFeedback"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
