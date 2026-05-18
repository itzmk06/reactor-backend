import { Request, Response, NextFunction } from 'express';
import { AppError } from './error';

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  console.error('[GLOBAL ERROR HANDLER]', err);
  return res.status(500).json({ success: false, message: 'Internal Server Error' });
}
