import { notFound } from '../errors';
import { favoriteRepository } from '../repositories/favoriteRepository';
import { recipeRepository } from '../repositories/recipeRepository';
import { serializeRecipe } from './recipeService';

export const userService = {
  async listFavorites(userId: string) {
    const favorites = await favoriteRepository.listForUser(userId);
    return favorites.map((f) => serializeRecipe(f.recipe));
  },

  async addFavorite(userId: string, recipeId: string) {
    const recipe = await recipeRepository.findByIdFull(recipeId);
    if (!recipe) throw notFound('Рецепт не найден');

    const existing = await favoriteRepository.find(userId, recipeId);
    if (existing) return { favorited: true };

    const favorite = await favoriteRepository.add(userId, recipeId);
    return { favorited: true, recipe: serializeRecipe(favorite.recipe) };
  },

  async removeFavorite(userId: string, recipeId: string) {
    await favoriteRepository.remove(userId, recipeId);
    return { favorited: false };
  },
};
