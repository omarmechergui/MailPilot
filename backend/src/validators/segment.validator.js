import { z } from 'zod';

// Supported filter operators for contact fields
const filterRuleSchema = z.object({
  field: z.enum(['email', 'name', 'status', 'isSubscribed', 'source']),
  operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'notEquals']),
  value: z.union([z.string(), z.boolean()]),
});

export const segmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  filters: z.array(filterRuleSchema).min(1, 'At least one filter rule is required').max(10),
});

export const segmentQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  pageSize: z.string().regex(/^\d+$/).transform(Number).default('20'),
});
