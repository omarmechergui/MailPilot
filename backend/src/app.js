import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './config/index.js';
import { checkDatabaseConnection } from './db.js';

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

// Security headers
app.use(helmet());

// CORS — allow the frontend origin with credentials (cookies)
app.use(
  cors({
    origin: config.frontendOrigin,
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json({ limit: '2mb' }));

// Parse cookies
app.use(cookieParser());

// ---------------------------------------------------------------------------
// Health endpoint (public)
// ---------------------------------------------------------------------------

app.get('/api/v1/health', async (_req, res) => {
  const dbConnected = await checkDatabaseConnection();
  
  if (dbConnected) {
    res.json({
      success: true,
      data: {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
    });
  } else {
    // Return a 503 Service Unavailable if the DB is disconnected
    res.status(503).json({
      success: false,
      data: {
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// ---------------------------------------------------------------------------
// Centralized error handler
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message =
    config.nodeEnv === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  console.error(`[error] ${err.message}`);

  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
    },
  });
});

export default app;
