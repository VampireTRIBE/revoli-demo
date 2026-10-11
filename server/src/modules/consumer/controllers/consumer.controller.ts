import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getConsumerDashboard, getConsumerOptions } from '../services/consumer.service.js';
const query = z.object({ year: z.coerce.number().int().min(2000).max(2100), month: z.coerce.number().int().min(0).max(12) });
export const options: RequestHandler = (_request,response) => response.json({ success: true, message: 'Consumer options fetched successfully', data: getConsumerOptions() });
export const dashboard: RequestHandler = async (request,response) => { const filter=query.parse(request.query); response.json({ success:true,message:'Consumer dashboard fetched successfully',data:await getConsumerDashboard(filter.year,filter.month) }); };
