import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getCreativeDashboard, getCreativeOptions } from '../services/creative.service.js';

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(0).max(12).optional(),
  brand: z.string().trim().min(1).optional(),
});

export const options: RequestHandler = async (_request, response) => {
  response.json({ success: true, message: 'Creative options fetched successfully', data: getCreativeOptions() });
};

export const dashboard: RequestHandler = async (request, response) => {
  const filter = querySchema.parse(request.query);
  response.json({ success: true, message: 'Creative dashboard fetched successfully', data: getCreativeDashboard(filter) });
};
