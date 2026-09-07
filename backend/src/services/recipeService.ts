import { Prisma } from '@prisma/client';
import { notFound } from '../errors';
import { prisma } from '../lib/prisma';
import { recipeRepository, RecipeFilter } from '../repositories/recipeRepository';
import { commentRepository } from '../repositories/commentRepository';

type RecipeFull = Prisma.RecipeGetPayload<{
  include: {
    category: true;
    author: true;
    ingredients: { include: { ingredient: true } };
  };
}>;

/** Приводим рецепт из БД к форме, которую ждёт фронтенд. */
export function serializeRecipe(r: RecipeFull) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category.name,
    cookingTime: r.cookingTime,
    servings: r.servings,
    imageUrl: r.imageUrl ?? '',
    rating: r.rating,
    authorId: r.authorId,
    authorName: r.author.name,
    ingredients: r.ingredients.map((ri) => ({
      ingredientId: ri.ingredientId,
      ingredientName: ri.ingredient.name,
      quantity: ri.quantity,
      unit: ri.unit,
    })),
    steps: r.steps,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export interface RecipeInput {
  title: string;
  description: string;
  category: string;
  cookingTime: number;
  servings: number;
  imageUrl?: string;
  ingredients: { ingredientName: string; quantity: string; unit: string }[];
  steps: string[];
}

const ensureFull = async (id: string) => {
  const recipe = await recipeRepository.findByIdFull(id);
  if (!recipe) throw notFound('Рецепт не найден');
  return recipe;
};

export const recipeService = {
  async list(filter: RecipeFilter) {
    const { recipes, total, page, totalPages } = await recipeRepository.list(filter);
    return {
      recipes: recipes.map(serializeRecipe),
      total,
      page,
      totalPages,
    };
  },

  async get(id: string) {
    return serializeRecipe(await ensureFull(id));
  },

  async create(userId: string, input: RecipeInput) {
    const category = await recipeRepository.upsertCategory(input.category || 'Прочее');
    const ingredientRows = await Promise.all(
      input.ingredients.map(async (ing) => ({
        quantity: ing.quantity || '1',
        unit: ing.unit || 'г',
        ingredient: { connect: { id: (await recipeRepository.upsertIngredient(ing.ingredientName.trim())).id } },
      }))
    );

    const recipe = await recipeRepository.create({
      title: input.title.trim(),
      description: input.description ?? '',
      cookingTime: input.cookingTime || 30,
      servings: input.servings || 1,
      imageUrl: input.imageUrl || null,
      steps: input.steps,
      categoryId: category.id,
      authorId: userId,
      ingredients: { create: ingredientRows },
    });

    return serializeRecipe(recipe);
  },

  async update(id: string, input: Partial<RecipeInput>) {
    await ensureFull(id);
    const category = input.category
      ? await recipeRepository.upsertCategory(input.category)
      : undefined;

    let ingredientRows:
      | { create: { quantity: string; unit: string; ingredient: { connect: { id: string } } }[] }
      | undefined;
    if (input.ingredients) {
      const rows = await Promise.all(
        input.ingredients.map(async (ing) => ({
          quantity: ing.quantity || '1',
          unit: ing.unit || 'г',
          ingredient: {
            connect: { id: (await recipeRepository.upsertIngredient(ing.ingredientName.trim())).id },
          },
        }))
      );
      await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
      ingredientRows = { create: rows };
    }

    const recipe = await recipeRepository.update(id, {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.cookingTime !== undefined ? { cookingTime: input.cookingTime } : {}),
      ...(input.servings !== undefined ? { servings: input.servings } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl || null } : {}),
      ...(input.steps !== undefined ? { steps: input.steps } : {}),
      ...(category ? { categoryId: category.id } : {}),
      ...(ingredientRows ? { ingredients: ingredientRows } : {}),
    });

    return serializeRecipe(recipe);
  },

  async remove(id: string) {
    await ensureFull(id);
    await recipeRepository.remove(id);
    return { success: true };
  },

  async rate(id: string, rating: number) {
    const recipe = await ensureFull(id);
    const next = Math.round(((recipe.rating + rating) / 2) * 10) / 10;
    return serializeRecipe(await recipeRepository.setRating(id, next));
  },

  async listComments(recipeId: string) {
    await ensureFull(recipeId);
    const comments = await commentRepository.listByRecipe(recipeId);
    return comments.map((c) => ({
      id: c.id,
      recipeId: c.recipeId,
      userId: c.userId,
      userName: c.user.name,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
    }));
  },

  async addComment(recipeId: string, userId: string, text: string) {
    await ensureFull(recipeId);
    const comment = await commentRepository.create({ recipeId, userId, text });
    return {
      id: comment.id,
      recipeId: comment.recipeId,
      userId: comment.userId,
      userName: comment.user.name,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
    };
  },

  listCategories: () => recipeRepository.listCategories(),
  listIngredients: (search?: string) => recipeRepository.listIngredients(search),
};
