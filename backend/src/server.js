import config from './config/index.js';
import app from './app.js';
import prisma from './db.js';

const server = app.listen(config.port, () => {
  console.log(
    `[server] MailPilot backend running on http://localhost:${config.port} (${config.nodeEnv})`
  );
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`[server] Received ${signal}. Shutting down gracefully…`);
  
  try {
    await prisma.$disconnect();
    console.log('[server] Database connection closed.');
  } catch (error) {
    console.error('[server] Error during database disconnection:', error.message);
  }

  server.close(() => {
    console.log('[server] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
