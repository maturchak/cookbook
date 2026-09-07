import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Маршрут не найден: ${req.method} ${req.path}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}
