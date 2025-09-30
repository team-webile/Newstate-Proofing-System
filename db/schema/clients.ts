import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  company: text("company"),
  address: text("address"),
  notes: text("notes"),
  logoUrl: text("logoUrl"),
  brandColor: text("brandColor"),
  themeMode: text("themeMode").notNull().default("system"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
