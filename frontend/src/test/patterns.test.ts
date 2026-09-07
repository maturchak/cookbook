import { describe, it, expect, beforeEach } from 'vitest';
import {
  RecipeFactorySelector,
  SoupRecipeFactory,
  BreakfastRecipeFactory,
  DefaultRecipeFactory,
} from '../services/RecipeFactory';
import type { RecipeDraft } from '../services/RecipeFactory';
import {
  TitleSearchStrategy,
  IngredientSearchStrategy,
  CategorySearchStrategy,
  CombinedSearchStrategy,
  SearchContext,
} from '../services/SearchStrategies';
import { eventBus } from '../services/EventBus';
import type { Observer, FavoriteToggledPayload } from '../services/EventBus';
import { FavoriteObserver } from '../services/FavoriteObserver';
import { mockRecipes } from '../services/mockData';

const draft: RecipeDraft = {
  title: 'Тестовое блюдо',
  description: 'описание',
  category: 'Супы',
  servings: 2,
  ingredients: [{ ingredientId: '', ingredientName: 'Вода', quantity: '1', unit: 'л' }],
  steps: ['Шаг 1'],
};

describe('Factory Method', () => {
  it('фабрика супов подставляет категорию и дефолтное время', () => {
    const recipe = new SoupRecipeFactory().create({ ...draft, category: '' });
    expect(recipe.category).toBe('Супы');
    expect(recipe.cookingTime).toBe(45);
  });

  it('заполняет обязательные поля рецепта', () => {
    const recipe = new BreakfastRecipeFactory().create({ ...draft, category: 'Завтрак' });
    expect(recipe.category).toBe('Завтрак');
    expect(recipe.cookingTime).toBe(15);
    expect(recipe.id).toBeTruthy();
    expect(recipe.createdAt).toBeTruthy();
    expect(recipe.imageUrl).toBe('/placeholder-food.svg');
  });

  it('селектор выбирает фабрику по категории, для неизвестной — дефолтную', () => {
    expect(RecipeFactorySelector.getFactory('Супы')).toBeInstanceOf(SoupRecipeFactory);
    const def = RecipeFactorySelector.getFactory('Салаты');
    expect(def).toBeInstanceOf(DefaultRecipeFactory);
    const salad = def.create({ ...draft, category: 'Салаты' });
    expect(salad.category).toBe('Салаты');
  });
});

describe('Strategy', () => {
  const recipes = mockRecipes;

  it('поиск по названию', () => {
    expect(new TitleSearchStrategy().search(recipes, 'борщ')).toHaveLength(1);
    expect(new TitleSearchStrategy().search(recipes, 'Ничего такого')).toHaveLength(0);
  });

  it('поиск по ингредиентам', () => {
    expect(new IngredientSearchStrategy(['свёкла']).search(recipes, '')).toHaveLength(1);
    expect(new IngredientSearchStrategy(['картофель']).search(recipes, '')).toHaveLength(4);
  });

  it('комбинированная стратегия применяет фильтры последовательно', () => {
    const combined = new CombinedSearchStrategy([
      new CategorySearchStrategy('Супы'),
      new IngredientSearchStrategy(['картофель']),
    ]);
    const res = combined.search(recipes, '');
    expect(res).toHaveLength(2);
    expect(res.map((r) => r.title)).toEqual(
      expect.arrayContaining(['Сырный суп с картофелем', 'Борщ с говядиной'])
    );
  });

  it('SearchContext подменяет стратегию на лету', () => {
    const ctx = new SearchContext();
    // стратегия по умолчанию — поиск по названию
    expect(ctx.executeSearch(recipes, 'пицца')).toHaveLength(1);
    ctx.setStrategy(new CategorySearchStrategy('Супы'));
    expect(ctx.executeSearch(recipes, '')).toHaveLength(3);
  });
});

describe('Observer / EventBus', () => {
  beforeEach(() => {
    eventBus.clear();
    localStorage.clear();
  });

  it('доставляет событие подписчику и прекращает после отписки', () => {
    const seen: string[] = [];
    const observer: Observer<FavoriteToggledPayload> = {
      update: (_event, data) => seen.push(data.recipeId),
    };

    eventBus.subscribe('FAVORITE_TOGGLED', observer);
    eventBus.notify('FAVORITE_TOGGLED', {
      recipeId: '1',
      isFavorited: true,
      recipe: mockRecipes[0],
    });
    expect(seen).toEqual(['1']);

    eventBus.unsubscribe('FAVORITE_TOGGLED', observer);
    eventBus.notify('FAVORITE_TOGGLED', { recipeId: '2', isFavorited: true, recipe: null });
    expect(seen).toEqual(['1']);
  });

  it('двойная подписка не дублирует доставк', () => {
    const seen: string[] = [];
    const observer: Observer<FavoriteToggledPayload> = {
      update: (_e, d) => seen.push(d.recipeId),
    };
    eventBus.subscribe('FAVORITE_TOGGLED', observer);
    eventBus.subscribe('FAVORITE_TOGGLED', observer);
    eventBus.notify('FAVORITE_TOGGLED', { recipeId: '5', isFavorited: true, recipe: null });
    expect(seen).toEqual(['5']);
  });

  it('FavoriteObserver зеркалирует избранное', () => {
    const observer = new FavoriteObserver();
    observer.update('FAVORITE_TOGGLED', {
      recipeId: '1',
      isFavorited: true,
      recipe: mockRecipes[0],
    });
    expect(observer.isFavorited('1')).toBe(true);

    observer.update('FAVORITE_TOGGLED', { recipeId: '1', isFavorited: false, recipe: null });
    expect(observer.isFavorited('1')).toBe(false);
  });
});
