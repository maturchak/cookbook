import { prisma } from '../lib/prisma';

export const commentRepository = {
  listByRecipe(recipeId: string) {
    return prisma.comment.findMany({
      where: { recipeId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  create(data: { recipeId: string; userId: string; text: string }) {
    return prisma.comment.create({ data, include: { user: true } });
  },
};
