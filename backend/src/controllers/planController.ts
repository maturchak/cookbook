import type { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth, getUserId } from '../middleware/auth';
import { badRequest } from '../errors';
import { planService, PlanItemInput } from '../services/planService';

export const planController = {
  list: [
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      res.json(await planService.list(getUserId(req)));
    }),
  ] as RequestHandler[],

  replace: [
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const items = req.body?.items;
      if (!Array.isArray(items)) throw badRequest('Ожидаю { items: [...] }');
      const normalized: PlanItemInput[] = (items as Record<string, unknown>[]).map((i) => ({
        dayOfWeek: Number(i.dayOfWeek),
        mealType: String(i.mealType),
        recipeId: String(i.recipeId),
      }));
      res.json(await planService.replace(getUserId(req), normalized));
    }),
  ] as RequestHandler[],
};
