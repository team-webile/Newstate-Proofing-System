import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { clients } from "./clients";

export const projectStatusEnum = pgEnum('project_status', ['ACTIVE', 'ARCHIVED', 'COMPLETED', 'REJECTED']);

export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientId: text("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  downloadEnabled: boolean("downloadEnabled").notNull().default(true),
  emailNotifications: boolean("emailNotifications").notNull().default(true),
  lastActivity: timestamp("lastActivity").notNull().defaultNow(),
  primaryColor: text("primaryColor"),
  secondaryColor: text("secondaryColor"),
  accentColor: text("accentColor"),
  customCss: text("customCss"),
  logoUrl: text("logoUrl"),
  themeMode: text("themeMode").notNull().default("system"),
});
