import { db } from '@/db';

// Database connection status check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Simple query to test connection
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
