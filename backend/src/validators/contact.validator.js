import { z } from 'zod';

export const contactQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INVALID', 'BLOCKED']).optional(),
  subscription: z.enum(['subscribed', 'unsubscribed']).optional(),
  archived: z.enum(['true', 'false']).optional().default('false'),
  sortBy: z.enum(['createdAt', 'email', 'name']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const createContactSchema = z.object({
  email: z.string().email('Invalid email address').trim(),
  name: z.string().trim().optional().nullable(),
  isSubscribed: z.boolean().optional().default(true),
  status: z.enum(['ACTIVE', 'INVALID', 'BLOCKED']).optional().default('ACTIVE'),
});

export const updateContactSchema = z.object({
  email: z.string().email('Invalid email address').trim().optional(),
  name: z.string().trim().optional().nullable(),
  isSubscribed: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INVALID', 'BLOCKED']).optional(),
});

export const subscriptionUpdateSchema = z.object({
  isSubscribed: z.boolean(),
});
