import { api } from './api';
import { recipeStore } from './recipeStore';
import { USE_MOCK } from './useMock';
import { RecipeFactorySelector } from './RecipeFactory';
import type { Recipe, Comment } from '../types';

export interface RecipeListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  ingredients?: string[];
}

export interface RecipeListResult {
  recipes: Recipe[];
  total: number;
  page: number;
  totalPages: number;
}

export interface NewRecipeInput {
  title: string;
  description: string;
  category: string;
  cookingTime: number;
  servings: number;
  imageUrl?: string;
  ingredients: Recipe['ingredients'];
  steps: string[];
}

const DEFAULT_LIMIT = 12;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const recipeService = {
  getRecipes: async (params?: RecipeListParams): Promise<RecipeListResult> => {
    if (USE_MOCK) {
      let recipes = recipeStore.all();

      if (params?.search) {
        const q = params.search.toLowerCase();
        recipes = recipes.filter(
          (r) =>
            r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
        );
      }
      if (params?.category && params.category !== 'Все') {
        recipes = recipes.filter((r) => r.category === params.category);
      }

      await delay(200);
      const limit = params?.limit ?? DEFAULT_LIMIT;
      return {
        recipes,
        total: recipes.length,
        page: params?.page ?? 1,
        totalPages: Math.max(1, Math.ceil(recipes.length / limit)),
      };
    }
    const response = await api.get<RecipeListResult>('/recipes', {
      params: {
        ...params,
        ingredients: params?.ingredients?.length ? params.ingredients.join(',') : undefined,
      },
    });
    return response.data;
  },

  getRecipeById: async (id: string): Promise<Recipe | null> => {
    if (USE_MOCK) {
      await delay(150);
      return recipeStore.byId(id) ?? null;
    }
    const response = await api.get<Recipe>(`/recipes/${id}`);
    return response.data;
  },

  createRecipe: async (data: NewRecipeInput): Promise<Recipe> => {
    if (USE_MOCK) {
      await delay(200);
      // Паттерн Factory Method: фабрика подбирается по категории блюда
      const factory = RecipeFactorySelector.getFactory(data.category);
      const newRecipe = factory.create(data);
      return recipeStore.add(newRecipe);
    }
    const response = await api.post<Recipe>('/recipes', data);
    return response.data;
  },

  updateRecipe: async (id: string, data: Partial<Recipe>): Promise<Recipe> => {
    if (USE_MOCK) {
      await delay(200);
      return recipeStore.update(id, data);
    }
    const response = await api.put<Recipe>(`/recipes/${id}`, data);
    return response.data;
  },

  deleteRecipe: async (id: string): Promise<{ success: boolean }> => {
    if (USE_MOCK) {
      await delay(200);
      recipeStore.remove(id);
      return { success: true };
    }
    const response = await api.delete<{ success: boolean }>(`/recipes/${id}`);
    return response.data;
  },

  getComments: async (recipeId: string): Promise<Comment[]> => {
    if (USE_MOCK) {
      await delay(150);
      return [
        {
          id: '1',
          recipeId,
          userId: '1',
          userName: 'Мария',
          text: 'Отличный рецепт! Очень понравилось всей семье!',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          recipeId,
          userId: '2',
          userName: 'Иван',
          text: 'Вкусно, но можно меньше солить',
          createdAt: new Date().toISOString(),
        },
      ];
    }
    const response = await api.get<Comment[]>(`/recipes/${recipeId}/comments`);
    return response.data;
  },

  addComment: async (recipeId: string, text: string): Promise<Comment> => {
    if (USE_MOCK) {
      await delay(200);
      return {
        id: String(Date.now()),
        recipeId,
        userId: '1',
        userName: 'Текущий пользователь',
        text,
        createdAt: new Date().toISOString(),
      };
    }
    const response = await api.post<Comment>(`/recipes/${recipeId}/comments`, { text });
    return response.data;
  },

  rateRecipe: async (recipeId: string, rating: number): Promise<Recipe | undefined> => {
    if (USE_MOCK) {
      await delay(150);
      const recipe = recipeStore.byId(recipeId);
      if (!recipe) return undefined;
      return recipeStore.update(recipeId, { rating: (recipe.rating + rating) / 2 });
    }
    const response = await api.post<Recipe>(`/recipes/${recipeId}/rate`, { rating });
    return response.data;
  },

  getFavorites: async (): Promise<Recipe[]> => {
    if (USE_MOCK) {
      await delay(150);
      return recipeStore.all().filter((r) => r.isFavorited);
    }
    const response = await api.get<Recipe[]>('/favorites');
    return response.data;
  },

  addFavorite: async (recipeId: string): Promise<void> => {
    await api.post(`/favorites/${recipeId}`);
  },

  removeFavorite: async (recipeId: string): Promise<void> => {
    await api.delete(`/favorites/${recipeId}`);
  },
};
