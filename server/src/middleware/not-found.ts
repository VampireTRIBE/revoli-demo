import type { RequestHandler } from 'express';

export const notFound: RequestHandler = (request, response) => {
  response.status(404).json({ success: false, message: `Route not found: ${request.method} ${request.path}`, error: { code: 'NOT_FOUND' } });
};
