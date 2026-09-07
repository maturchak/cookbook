import type { Recipe } from '../types';

/**
 * Паттерн Strategy (Стратегия).
 * Каждый способ фильтрации рецептов — отдельная стратегия с общим
 * интерфейсом. CombinedSearchStrategy комбинирует несколько,
 * SearchContext — «контекст», которому можно подменять стратегию на лету.
 */

export interface SearchStrategy {
  search(recipes: Recipe[], query: string): Recipe[];
}

/** Поиск по названию и описанию. */
export class TitleSearchStrategy implements SearchStrategy {
  search(recipes: Recipe[], query: string): Recipe[] {
    const q = query.toLowerCase();
    return recipes.filter(
      (r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    );
  }
}

/** Поиск по ингредиентам: рецепт подходит, если содержит хотя бы один. */
export class IngredientSearchStrategy implements SearchStrategy {
  private ingredients: string[];

  constructor(ingredients: string[]) {
    this.ingredients = ingredients.map((i) => i.toLowerCase());
  }

  search(recipes: Recipe[], _query: string): Recipe[] {
    return recipes.filter((r) =>
      r.ingredients.some((ri) =>
        this.ingredients.some((ing) => ri.ingredientName.toLowerCase().includes(ing))
      )
    );
  }
}

/** Фильтр по категории. */
export class CategorySearchStrategy implements SearchStrategy {
  private category: string;

  constructor(category: string) {
    this.category = category;
  }

  search(recipes: Recipe[], _query: string): Recipe[] {
    if (this.category === 'Все') return recipes;
    return recipes.filter((r) => r.category === this.category);
  }
}

/** Последовательно применяет несколько стратегий. */
export class CombinedSearchStrategy implements SearchStrategy {
  private strategies: SearchStrategy[];

  constructor(strategies: SearchStrategy[]) {
    this.strategies = strategies;
  }

  search(recipes: Recipe[], query: string): Recipe[] {
    let results = recipes;
    for (const strategy of this.strategies) {
      results = strategy.search(results, query);
    }
    return results;
  }
}

/** Контекст: хранит текущую стратегию и запускает поиск. */
export class SearchContext {
  private strategy: SearchStrategy | null = null;

  setStrategy(strategy: SearchStrategy): void {
    this.strategy = strategy;
  }

  executeSearch(recipes: Recipe[], query: string): Recipe[] {
    const active = this.strategy ?? new TitleSearchStrategy();
    return active.search(recipes, query);
  }
}
