import type { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth, getUserId } from '../middleware/auth';
import { badRequest } from '../errors';
import { recipeService, RecipeInput } from '../services/recipeService';

const parseListBody = (body: unknown): RecipeInput => {
  const b = (body ?? {}) as Record<string, unknown>;
  if (!b.title || typeof b.title !== 'string' || !b.title.trim()) {
    throw badRequest('Введите название рецепта');
  }
  const ingredients = Array.isArray(b.ingredients) ? b.ingredients : [];
  const steps = Array.isArray(b.steps) ? (b.steps as string[]).filter((s) => s?.trim()) : [];
  if (ingredients.length === 0) throw badRequest('Добавьте хотя бы один ингредиент');
  if (steps.length === 0) throw badRequest('Добавьте хотя бы один шаг приготовления');

  return {
    title: String(b.title),
    description: String(b.description ?? ''),
    category: String(b.category ?? 'Прочее'),
    cookingTime: Number(b.cookingTime) || 30,
    servings: Number(b.servings) || 1,
    imageUrl: b.imageUrl ? String(b.imageUrl) : undefined,
    ingredients: (ingredients as Record<string, unknown>[]).map((i) => ({
      ingredientName: String(i.ingredientName ?? ''),
      quantity: String(i.quantity ?? '1'),
      unit: String(i.unit ?? 'г'),
    })),
    steps,
  };
};

export const recipeController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { search, category, page, limit, ingredients } = req.query;
    res.json(
      await recipeService.list({
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
        ingredients: ingredients
          ? String(ingredients)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      })
    );
  }),

  get: asyncHandler(async (req, res) => {
    res.json(await recipeService.get(String(req.params.id)));
  }),

  create: [
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const recipe = await recipeService.create(getUserId(req), parseListBody(req.body));
      res.status(201).json(recipe);
    }),
  ] as RequestHandler[],

  update: [
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      res.json(await recipeService.update(String(req.params.id), parseListBody(req.body)));
    }),
  ] as RequestHandler[],

  remove: [
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      res.json(await recipeService.remove(String(req.params.id)));
    }),
  ] as RequestHandler[],

  rate: [
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const rating = Number(req.body?.rating);
      if (!rating || rating < 1 || rating > 5) throw badRequest('Оценка от 1 до 5');
      res.json(await recipeService.rate(String(req.params.id), rating));
    }),
  ] as RequestHandler[],

  listComments: asyncHandler(async (req, res) => {
    res.json(await recipeService.listComments(String(req.params.id)));
  }),

  addComment: [
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const text = String(req.body?.text ?? '').trim();
      if (!text) throw badRequest('Введите текст комментария');
      res.status(201).json(await recipeService.addComment(String(req.params.id), getUserId(req), text));
    }),
  ] as RequestHandler[],

  listCategories: asyncHandler(async (_req, res) => {
    res.json(await recipeService.listCategories());
  }),

  listIngredients: asyncHandler(async (req, res) => {
    res.json(await recipeService.listIngredients(req.query.search ? String(req.query.search) : undefined));
  }),
};
