import { z } from 'zod';

export const periodQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  segment: z.string().trim().min(1).optional(),
  brand: z.string().trim().min(1).optional(),
}).refine((value) => !value.month || value.year, { message: 'Month requires a year selection', path: ['month'] });

export const campaignQuerySchema = periodQuerySchema.and(z.object({
  platform: z.enum(['Google Ads', 'Meta Ads']).optional(),
  stage: z.string().trim().min(1).optional(),
  campaignType: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['spend', 'campaign']).default('spend'),
  order: z.enum(['asc', 'desc']).default('desc'),
}));

export const organicQuerySchema = periodQuerySchema.and(z.object({ market: z.string().trim().min(1).optional() }));
