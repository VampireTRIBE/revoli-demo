import { z } from 'zod';

const multiValue = z.preprocess((value) => {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.flatMap((entry) => typeof entry === 'string' ? entry.split(',') : [])
    .map((entry) => entry.trim()).filter(Boolean))];
}, z.array(z.string().min(1)).min(1)).optional();

export const periodQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  segment: multiValue,
  brand: multiValue,
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
