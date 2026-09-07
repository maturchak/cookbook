import { prisma } from '../lib/prisma';

const withRecipe = {
  include: {
    recipe: { include: { category: true, author: true, ingredients: { include: { ingredient: true } } } },
  },
};

export const favoriteRepository = {
  listForUser(userId: string) {
    return prisma.favorite.findMany({ where: { userId }, ...withRecipe, orderBy: { id: 'asc' } });
  },

  add(userId: string, recipeId: string) {
    return prisma.favorite.create({ data: { userId, recipeId }, ...withRecipe });
  },

  remove(userId: string, recipeId: string) {
    return prisma.favorite.deleteMany({ where: { userId, recipeId } });
  },

  find(userId: string, recipeId: string) {
    return prisma.favorite.findUnique({
      where: { userId_recipeId: { userId, recipeId } },
    });
  },
};
