import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { reviews } from "./reviews";

export const elementStatusEnum = pgEnum('element_status', ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION']);

export const elements = pgTable("elements", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  status: elementStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  reviewId: text("reviewId").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  elementName: text("elementName").notNull(),
  filePath: text("filePath").notNull(),
  version: integer("version").notNull().default(1),
});
