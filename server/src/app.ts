import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { mediaRouter } from './modules/media/routes/media.routes.js';
import { creativeRouter } from './modules/creative/routes/creative.routes.js';
import { competitionRouter } from './modules/competition/routes/competition.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/v1/health', (_request, response) => response.json({ success: true, message: 'BizCom Media API is healthy', data: { service: 'media' } }));
app.use('/api/v1/media', mediaRouter);
app.use('/api/v1/creative', creativeRouter);
app.use('/api/v1/competition', competitionRouter);
app.use(notFound);
app.use(errorHandler);
