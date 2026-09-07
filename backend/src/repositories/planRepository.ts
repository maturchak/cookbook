import { prisma } from '../lib/prisma';

const withRecipe = { include: { recipe: true } };

export const planRepository = {
  listForUser(userId: string) {
    return prisma.planItem.findMany({
      where: { userId },
      ...withRecipe,
      orderBy: [{ dayOfWeek: 'asc' }, { id: 'asc' }],
    });
  },

  async replaceAll(userId: string, items: { dayOfWeek: number; mealType: string; recipeId: string }[]) {
    return prisma.$transaction([
      prisma.planItem.deleteMany({ where: { userId } }),
      prisma.planItem.createMany({
        data: items.map((item) => ({ ...item, userId })),
      }),
    ]);
  },
};
