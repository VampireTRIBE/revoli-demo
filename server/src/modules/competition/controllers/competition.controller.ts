import type { RequestHandler } from 'express';
import { z } from 'zod';
import { findCaptureAsset, getCompetitionDashboard, getCompetitionOptions } from '../services/competition.service.js';

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  competitor: z.string().trim().min(1).optional(),
  captureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const optionsQuerySchema = z.object({ clientId: z.string().trim().min(1).optional() });

export const options: RequestHandler = (request, response) => {
  const filter = optionsQuerySchema.parse(request.query);
  response.json({ success: true, message: 'Competition options fetched successfully', data: getCompetitionOptions(filter.clientId) });
};

export const dashboard: RequestHandler = (request, response) => {
  const filter = querySchema.parse(request.query);
  response.json({ success: true, message: 'Competition dashboard fetched successfully', data: getCompetitionDashboard(filter) });
};

export const asset: RequestHandler = (request, response, next) => {
  const match = findCaptureAsset(param(request.params.competitorId), param(request.params.captureDate), param(request.params.assetFile));
  if (!match) {
    response.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Competition image was not found.' } });
    return;
  }
  response.sendFile(match.file, { root: match.directory }, (error) => {
    if (error && !response.headersSent) next(error);
  });
};

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}
