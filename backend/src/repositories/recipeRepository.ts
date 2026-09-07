import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface RecipeFilter {
  search?: string;
  category?: string;
  ingredients?: string[];
  page?: number;
  limit?: number;
}

const fullInclude = {
  category: true,
  author: true,
  ingredients: { include: { ingredient: true } },
} satisfies Prisma.RecipeInclude;

export const recipeRepository = {
  async list(filter: RecipeFilter) {
    const where: Prisma.RecipeWhereInput = {};

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.category && filter.category !== 'Все') {
      where.category = { name: filter.category };
    }
    if (filter.ingredients && filter.ingredients.length > 0) {
      // рецепт подходит, если содержит хотя бы один из ингредиентов
      where.ingredients = {
        some: {
          ingredient: {
            OR: filter.ingredients.map((ing) => ({
              name: { contains: ing, mode: 'insensitive' as const },
            })),
          },
        },
      };
    }

    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(100, Math.max(1, filter.limit ?? 12));

    const [total, recipes] = await prisma.$transaction([
      prisma.recipe.count({ where }),
      prisma.recipe.findMany({
        where,
        include: fullInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { recipes, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
  },

  findByIdFull(id: string) {
    return prisma.recipe.findUnique({ where: { id }, include: fullInclude });
  },

  create(data: Prisma.RecipeUncheckedCreateInput) {
    return prisma.recipe.create({ data, include: fullInclude });
  },

  update(id: string, data: Prisma.RecipeUncheckedUpdateInput) {
    return prisma.recipe.update({ where: { id }, data, include: fullInclude });
  },

  remove(id: string) {
    return prisma.recipe.delete({ where: { id } });
  },

  setRating(id: string, rating: number) {
    return prisma.recipe.update({ where: { id }, data: { rating }, include: fullInclude });
  },

  upsertCategory(name: string) {
    return prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  },

  upsertIngredient(name: string) {
    return prisma.ingredient.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  },

  listCategories() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  },

  listIngredients(search?: string) {
    return prisma.ingredient.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
      orderBy: { name: 'asc' },
      take: 50,
    });
  },
};
