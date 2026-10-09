import 'dotenv/config';
import { z } from 'zod';

/**
 * Centralized environment configuration.
 * Validates required variables at import time using Zod.
 * Never expose secrets through this module's exports.
 */

const envSchema = z.object({
  PORT: z.string().regex(/^\d+$/).default('5000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3000'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.string().regex(/^\d+$/).default('1025'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().email().default('mailpilot@localhost'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[config] Environment variable validation failed:');
  console.error(parsed.error.format());
  console.error('[config] See .env.example for required values.');
  process.exit(1);
}

const env = parsed.data;

const config = {
  port: parseInt(env.PORT, 10),
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  frontendOrigin: env.FRONTEND_ORIGIN,
  smtp: {
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10),
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
  },
};

export default config;
