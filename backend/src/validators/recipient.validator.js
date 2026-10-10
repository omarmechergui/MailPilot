import { z } from 'zod';

export const addRecipientsSchema = z.object({
  body: z.object({
    contactIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format')).max(100, 'Cannot add more than 100 contacts at once'),
  })
});

export const recipientQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  status: z.enum(['PENDING', 'SENDING', 'ACCEPTED', 'FAILED', 'SKIPPED', 'UNKNOWN']).optional(),
});
