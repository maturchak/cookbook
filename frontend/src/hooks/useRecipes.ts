import { useState, useEffect, useCallback, useRef } from 'react';
import { Recipe } from '../types';
import { recipeService } from '../services/recipeService';
import { recipeStore } from '../services/recipeStore';
import { USE_MOCK } from '../services/useMock';
import {
  SearchContext,
  SearchStrategy,
  TitleSearchStrategy,
  CategorySearchStrategy,
  IngredientSearchStrategy,
  CombinedSearchStrategy,
} from '../services/SearchStrategies';

export interface RecipeFilters {
  search?: string;
  category?: string;
  ingredients?: string[];
}

export const PAGE_SIZE = 8;

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const filtersRef = useRef<RecipeFilters>({});

  const load = useCallback(async (filters: RecipeFilters, nextPage: number) => {
    filtersRef.current = filters;
    setLoading(true);
    setError(null);
    try {
      if (USE_MOCK) {
        // Паттерн Strategy: фильтры собираются из стратегий
        const strategies: SearchStrategy[] = [];
        if (filters.search) strategies.push(new TitleSearchStrategy());
        if (filters.category && filters.category !== 'Все') {
          strategies.push(new CategorySearchStrategy(filters.category));
        }
        if (filters.ingredients && filters.ingredients.length > 0) {
          strategies.push(new IngredientSearchStrategy(filters.ingredients));
        }

        const searchContext = new SearchContext();
        let filtered = [...recipeStore.all()];
        if (strategies.length > 0) {
          searchContext.setStrategy(
            strategies.length === 1 ? strategies[0] : new CombinedSearchStrategy(strategies)
          );
          filtered = searchContext.executeSearch(filtered, filters.search ?? '');
        }

        const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        const clamped = Math.min(Math.max(1, nextPage), pages);
        setTotal(filtered.length);
        setTotalPages(pages);
        setPage(clamped);
        setRecipes(filtered.slice((clamped - 1) * PAGE_SIZE, clamped * PAGE_SIZE));
      } else {
        // Реальный режим: фильтрация и пагинация на сервере
        const res = await recipeService.getRecipes({
          ...filters,
          page: nextPage,
          limit: PAGE_SIZE,
        });
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
        setRecipes(res.recipes);
      }
    } catch (err) {
      setError('Ошибка загрузки рецептов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecipes = useCallback(
    (filters: RecipeFilters = {}) => load(filters, 1),
    [load]
  );
  const searchRecipes = useCallback((search?: string) => load({ search }, 1), [load]);
  const filterByCategory = useCallback(
    (category: string) => load({ category }, 1),
    [load]
  );
  const searchByIngredients = useCallback(
    (ingredients: string[]) => load({ ingredients }, 1),
    [load]
  );
  const changePage = useCallback((nextPage: number) => load(filtersRef.current, nextPage), [load]);

  const getRecipe = useCallback(
    (id: string): Recipe | undefined => {
      return recipes.find((r) => r.id === id) || recipeStore.byId(id);
    },
    [recipes]
  );

  useEffect(() => {
    load({}, 1);
  }, [load]);

  return {
    recipes,
    loading,
    error,
    total,
    totalPages,
    page,
    limit: PAGE_SIZE,
    setPage: changePage,
    fetchRecipes,
    searchRecipes,
    filterByCategory,
    searchByIngredients,
    changePage,
    getRecipe,
  };
};
