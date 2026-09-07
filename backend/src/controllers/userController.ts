import type { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth, getUserId } from '../middleware/auth';
import { userService } from '../services/userService';

export const userController = {
  listFavorites: [
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      res.json(await userService.listFavorites(getUserId(req)));
    }),
  ] as RequestHandler[],

  addFavorite: [
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      res.json(await userService.addFavorite(getUserId(req), String(req.params.recipeId)));
    }),
  ] as RequestHandler[],

  removeFavorite: [
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      res.json(await userService.removeFavorite(getUserId(req), String(req.params.recipeId)));
    }),
  ] as RequestHandler[],
};
