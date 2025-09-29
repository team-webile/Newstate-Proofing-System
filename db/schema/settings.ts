import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const settings = pgTable("settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  approvalMessage: text("approval_message").notNull().default("Thank you for your approval!"),
  signatureMessage: text("signature_message").notNull().default("By signing below, I approve this design element."),
  companyName: text("company_name").notNull().default("New State Branding"),
  themeMode: text("theme_mode").notNull().default("system"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  accentColor: text("accent_color"),
  borderRadius: text("border_radius").notNull().default("0.625rem"),
  fontFamily: text("font_family").notNull().default("Inter"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  customCss: text("custom_css"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});
