import { z } from 'zod';

export const createCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer').trim(),
    subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be 200 characters or fewer').trim(),
    htmlContent: z.string().max(100000).optional().nullable(),
    textContent: z.string().max(100000).optional().nullable(),
  })
});

export const updateCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    subject: z.string().min(1).max(200).trim().optional(),
    htmlContent: z.string().max(100000).optional().nullable(),
    textContent: z.string().max(100000).optional().nullable(),
  })
});

export const campaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['DRAFT', 'SENDING', 'COMPLETED', 'COMPLETED_WITH_FAILURES', 'FAILED']).optional(),
});

export const sendCampaignSchema = z.object({
  body: z.object({
    confirm: z.literal(true, { errorMap: () => ({ message: 'You must confirm to send' }) })
  })
});
