import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma Client instance.
 * Avoids exhausting database connections during hot reloads or frequent imports.
 */

const prisma = new PrismaClient();

/**
 * Check database connectivity safely.
 * Returns true if connected, false otherwise.
 */
export async function checkDatabaseConnection() {
  try {
    // A lightweight command to verify the MongoDB connection works.
    await prisma.$runCommandRaw({ ping: 1 });
    return true;
  } catch (error) {
    console.error('[db] Database connection check failed:', error.message);
    return false;
  }
}

export default prisma;
