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

import authRoutes from './routes/auth.routes.js';
import contactRoutes from './routes/contact.routes.js';
import campaignRoutes from './routes/campaign.routes.js';
import templateRoutes from './routes/template.routes.js';
import segmentRoutes from './routes/segment.routes.js';

// ---------------------------------------------------------------------------
// Health endpoint (public)
// ---------------------------------------------------------------------------

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/segments', segmentRoutes);

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
app.use((err, req, res, _next) => {
  let status = err.status || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';

  if (err.name === 'ZodError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request data';
  } else if (status < 500) {
    message = err.message || 'Client error';
  } else {
    message = 'Internal server error';
  }

  // Sanitize logging to prevent secret leakage
  // We log the error name, status, and path. We explicitly do NOT log err.message or stack.
  const errorCategory = status < 500 ? 'ClientError' : 'ServerError';
  const errorName = err.name || 'Error';
  const path = req.originalUrl || req.path || 'unknown path';
  
  console.error(`[${errorCategory}] Name: ${errorName} | Status: ${status} | Path: ${path}`);

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
});

export default app;
