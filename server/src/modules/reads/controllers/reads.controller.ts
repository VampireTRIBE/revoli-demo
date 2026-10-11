import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getTblReads } from '../services/reads.service.js';

const querySchema = z.object({
  client: z.string().trim().min(1),
  section: z.enum(['Media', 'Creative', 'Consumer', 'Competition']),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(0).max(12),
});

export const list: RequestHandler = (request, response) => {
  const query = querySchema.parse(request.query);
  response.json({ success: true, message: 'TBL reads fetched successfully', data: getTblReads(query.client, query.section, query.year, query.month) });
};
