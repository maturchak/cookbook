import { notFound } from '../errors';
import { planRepository } from '../repositories/planRepository';
import { recipeRepository } from '../repositories/recipeRepository';

export interface PlanItemInput {
  dayOfWeek: number;
  mealType: string;
  recipeId: string;
}

const serialize = (item: {
  id: string;
  dayOfWeek: number;
  mealType: string;
  recipeId: string;
  recipe: { title: string };
}) => ({
  id: item.id,
  dayOfWeek: item.dayOfWeek,
  mealType: item.mealType,
  recipeId: item.recipeId,
  recipeTitle: item.recipe.title,
});

export const planService = {
  async list(userId: string) {
    const items = await planRepository.listForUser(userId);
    return items.map(serialize);
  },

  async replace(userId: string, items: PlanItemInput[]) {
    for (const item of items) {
      const recipe = await recipeRepository.findByIdFull(item.recipeId);
      if (!recipe) throw notFound(`Рецепт не найден: ${item.recipeId}`);
      if (item.dayOfWeek < 0 || item.dayOfWeek > 6) throw notFound('Некорректный день недели');
    }
    await planRepository.replaceAll(userId, items);
    return this.list(userId);
  },
};
