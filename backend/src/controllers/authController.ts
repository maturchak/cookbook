import type { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth, getUserId } from '../middleware/auth';
import { badRequest } from '../errors';
import { authService } from '../services/authService';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password) throw badRequest('Заполните все поля');
    const result = await authService.register(String(name), String(email), String(password));
    res.status(201).json(result);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) throw badRequest('Заполните все поля');
    res.json(await authService.login(String(email), String(password)));
  }),

  me: [
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      res.json(await authService.me(getUserId(req)));
    }),
  ] as RequestHandler[],
};
