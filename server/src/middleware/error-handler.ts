import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/api-error.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({ success: false, message: error.message, error: { code: error.code, details: error.details } });
    return;
  }
  if (error instanceof ZodError) {
    response.status(400).json({ success: false, message: 'Request validation failed', error: { code: 'VALIDATION_ERROR', details: error.issues } });
    return;
  }
  console.error(error);
  response.status(500).json({ success: false, message: 'Unexpected server error', error: { code: 'INTERNAL_ERROR' } });
};
