import { pgTable, text, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { elements } from "./elements";

export const elementVersions = pgTable("element_versions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  version: integer("version").notNull(),
  filename: text("filename").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  elementId: text("element_id").notNull().references(() => elements.id, { onDelete: "cascade" }),
}, (table) => ({
  uniqueElementVersion: unique().on(table.elementId, table.version),
}));
