import config from './config/index.js';
import app from './app.js';

const server = app.listen(config.port, () => {
  console.log(
    `[server] MailPilot backend running on http://localhost:${config.port} (${config.nodeEnv})`
  );
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`[server] Received ${signal}. Shutting down gracefully…`);
  server.close(() => {
    console.log('[server] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
