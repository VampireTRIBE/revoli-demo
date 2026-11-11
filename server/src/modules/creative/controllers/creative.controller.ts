import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getCreativeDashboard, getCreativeOptions } from '../services/creative.service.js';
import { getCleoSnapshot } from '../cleo/cleo-import.js';

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

const cleoQuerySchema = z.object({ brand: z.literal('union-coop'), captureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() });
export const cleo: RequestHandler = (request, response) => {
  const { captureDate } = cleoQuerySchema.parse(request.query);
  const snapshot = getCleoSnapshot(captureDate);
  if (!snapshot) {
    response.status(404).json({ success: false, message: captureDate ? `CLEO capture ${captureDate} not found` : 'CLEO workbook not received', data: null });
    return;
  }
  response.json({ success: true, message: 'CLEO import loaded', data: snapshot });
};
