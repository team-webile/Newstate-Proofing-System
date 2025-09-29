import { db } from "@/db";
import { checkDatabaseConnection } from "./db-utils";

// Export the Drizzle database instance as 'prisma' for compatibility
export const prisma = db;

// Export database connection check utility
export { checkDatabaseConnection };
