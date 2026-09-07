import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config';
import { unauthorized } from '../errors';

export interface AuthRequest extends Request {
  userId?: string;
}

export const getUserId = (req: Request): string => (req as AuthRequest).userId!;

/** Middleware аутентификации: проверяет Bearer-токен и кладёт userId в запрос. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(unauthorized());
    return;
  }
  try {
    const payload = jwt.verify(header.slice('Bearer '.length), CONFIG.jwtSecret) as {
      sub: string;
    };
    (req as AuthRequest).userId = payload.sub;
    next();
  } catch {
    next(unauthorized('Токен недействителен или истёк'));
  }
}
