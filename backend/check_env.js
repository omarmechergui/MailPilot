import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    console.log('DB_CONNECTION: SUCCESS');
  } catch (err) {
    // Sanitize: only print error name, not the full message which may contain the URL
    console.log('DB_CONNECTION: FAILED');
    console.log('ERROR_NAME: ' + (err.name || 'Unknown'));
    console.log('ERROR_CODE: ' + (err.code || 'N/A'));
  } finally {
    await prisma.$disconnect();
  }
}

main();
