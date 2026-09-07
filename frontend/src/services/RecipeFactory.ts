import type { Recipe } from '../types';

/**
 * Паттерн Factory Method (Фабричный метод).
 * Каждая категория блюд имеет свою фабрику с осмысленными значениями
 * по умолчанию (время готовки и т.п.). RecipeFactorySelector выбирает
 * нужную фабрику по категории — «фабрика фабрик».
 */

export interface RecipeDraft {
  title: string;
  description: string;
  category: string;
  cookingTime?: number;
  servings: number;
  imageUrl?: string;
  ingredients: Recipe['ingredients'];
  steps: string[];
}

export interface RecipeCreator {
  create(data: RecipeDraft): Recipe;
}

function buildRecipe(data: RecipeDraft, fallbackCategory: string, defaultCookingTime: number): Recipe {
  // Категория из формы приоритетна; фабрика лишь подстраховывает дефолтом
  const category = data.category || fallbackCategory;
  const now = new Date().toISOString();
  return {
    title: data.title,
    description: data.description,
    category,
    cookingTime: data.cookingTime ?? defaultCookingTime,
    servings: data.servings,
    imageUrl: data.imageUrl || '/placeholder-food.svg',
    ingredients: data.ingredients,
    steps: data.steps,
    id: String(Date.now()),
    rating: 0,
    authorId: '1',
    authorName: 'Текущий пользователь',
    isFavorited: false,
    createdAt: now,
    updatedAt: now,
  };
}

/** Супы обычно варятся дольше. */
export class SoupRecipeFactory implements RecipeCreator {
  create(data: RecipeDraft): Recipe {
    return buildRecipe(data, 'Супы', 45);
  }
}

/** Десерты — в основном выпекание/охлаждение, время среднее. */
export class DessertRecipeFactory implements RecipeCreator {
  create(data: RecipeDraft): Recipe {
    return buildRecipe(data, 'Десерт', 30);
  }
}

/** Основные блюда: жарка/тушение, время побольше. */
export class MainDishRecipeFactory implements RecipeCreator {
  create(data: RecipeDraft): Recipe {
    return buildRecipe(data, 'Ужин', 50);
  }
}

/** Завтраки быстрые. */
export class BreakfastRecipeFactory implements RecipeCreator {
  create(data: RecipeDraft): Recipe {
    return buildRecipe(data, 'Завтрак', 15);
  }
}

/** Категории без собственной фабрики сохраняют выбранную категорию. */
export class DefaultRecipeFactory implements RecipeCreator {
  create(data: RecipeDraft): Recipe {
    return buildRecipe(data, data.category, 30);
  }
}

export class RecipeFactorySelector {
  static getFactory(category: string): RecipeCreator {
    switch (category) {
      case 'Супы':
        return new SoupRecipeFactory();
      case 'Десерт':
        return new DessertRecipeFactory();
      case 'Ужин':
      case 'Обед':
        return new MainDishRecipeFactory();
      case 'Завтрак':
        return new BreakfastRecipeFactory();
      default:
        return new DefaultRecipeFactory();
    }
  }
}
