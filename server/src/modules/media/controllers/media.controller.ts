import type { RequestHandler } from 'express';
import { campaignQuerySchema, organicQuerySchema, periodQuerySchema } from '../validators/media-query.validator.js';
import {
  getBrands,
  getCalculationAudit,
  getCampaigns,
  getFunnel,
  getOrganicDemand,
  getOverview,
  getPeriods,
  getPlatforms,
  getReconciliation,
  getSegments,
} from '../services/media-analytics.service.js';
import { getImport, listImports } from '../repositories/media.repository.js';
import { importMediaPackage } from '../import/import.service.js';
import { ApiError } from '../../../utils/api-error.js';

const send = (response: Parameters<RequestHandler>[1], message: string, data: unknown) => response.json({ success: true, message, data });

export const periods: RequestHandler = async (_request, response) => send(response, 'Media periods fetched successfully', await getPeriods());
export const overview: RequestHandler = async (request, response) => send(response, 'Media overview fetched successfully', await getOverview(periodQuerySchema.parse(request.query)));
export const platforms: RequestHandler = async (request, response) => send(response, 'Media platforms fetched successfully', await getPlatforms(periodQuerySchema.parse(request.query)));
export const campaigns: RequestHandler = async (request, response) => send(response, 'Media campaigns fetched successfully', await getCampaigns(campaignQuerySchema.parse(request.query)));
export const brands: RequestHandler = async (request, response) => send(response, 'Media brands fetched successfully', await getBrands(periodQuerySchema.parse(request.query)));
export const segments: RequestHandler = async (request, response) => send(response, 'Media segments fetched successfully', await getSegments(periodQuerySchema.parse(request.query)));
export const reconciliation: RequestHandler = async (request, response) => send(response, 'Media reconciliation fetched successfully', await getReconciliation(periodQuerySchema.parse(request.query)));
export const funnel: RequestHandler = async (request, response) => send(response, 'Media funnel fetched successfully', await getFunnel(periodQuerySchema.parse(request.query)));
export const organicDemand: RequestHandler = async (request, response) => send(response, 'Organic demand fetched successfully', await getOrganicDemand(organicQuerySchema.parse(request.query)));
export const calculationAudit: RequestHandler = async (request, response) => send(response, 'Calculation audit fetched successfully', await getCalculationAudit(periodQuerySchema.parse(request.query)));

export const imports: RequestHandler = async (_request, response) => send(response, 'Media imports fetched successfully', await listImports());
export const importById: RequestHandler = async (request, response) => {
  const batchId = Array.isArray(request.params.batchId) ? request.params.batchId[0] ?? '' : request.params.batchId ?? '';
  const batch = await getImport(batchId);
  if (!batch) throw new ApiError(404, 'IMPORT_NOT_FOUND', 'Media import batch was not found.');
  send(response, 'Media import fetched successfully', batch);
};
export const createImport: RequestHandler = async (request, response) => {
  if (!request.file) throw new ApiError(400, 'MISSING_WORKBOOK', 'Choose a .xlsx workbook or .zip package to upload.');
  const result = await importMediaPackage(request.file, request.body.replaceExisting === 'true');
  response.status(201).json({ success: true, message: 'Media package imported successfully', data: result });
};
