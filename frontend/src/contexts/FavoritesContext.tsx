import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Recipe } from '../types';
import { recipeStore } from '../services/recipeStore';
import { recipeService } from '../services/recipeService';
import { USE_MOCK } from '../services/useMock';
import { eventBus } from '../services/EventBus';
import { favoriteObserver } from '../services/FavoriteObserver';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'cookbook:favorites:v3';

interface FavoritesContextType {
  favorites: Recipe[];
  favoriteIds: string[];
  toggleFavorite: (recipeId: string, recipe?: Recipe) => void;
  isFavorited: (recipeId: string) => boolean;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

function readFavorites(): Recipe[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as Recipe[]) : [];
  } catch {
    return [];
  }
}

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<Recipe[]>(() =>
    USE_MOCK ? readFavorites() : []
  );

  // Observer: наблюдатель за избранным живёт, пока живёт провайдер
  useEffect(() => {
    eventBus.subscribe('FAVORITE_TOGGLED', favoriteObserver);
    return () => eventBus.unsubscribe('FAVORITE_TOGGLED', favoriteObserver);
  }, []);

  // Реальный режим: избранное живёт на сервере, подтягиваем после логина
  useEffect(() => {
    if (USE_MOCK || !isAuthenticated) return;
    recipeService
      .getFavorites()
      .then(setFavorites)
      .catch((err) => console.error('Не удалось загрузить избранное', err));
  }, [isAuthenticated]);

  const toggleFavorite = useCallback(
    (recipeId: string, passedRecipe?: Recipe) => {
      const exists = favorites.some((r) => r.id === recipeId);
      const recipe =
        passedRecipe ??
        recipeStore.byId(recipeId) ??
        favorites.find((r) => r.id === recipeId) ??
        null;

      const next = exists
        ? favorites.filter((r) => r.id !== recipeId)
        : recipe
          ? [...favorites, recipe]
          : favorites;

      // оптимистично обновляем UI
      setFavorites(next);
      if (USE_MOCK) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* localStorage недоступен */
        }
      } else {
        const request = exists
          ? recipeService.removeFavorite(recipeId)
          : recipeService.addFavorite(recipeId);
        request.catch((err) => {
          console.error('Не удалось сохранить избранное', err);
          setFavorites(favorites); // откат
        });
      }

      // Публикуем событие для наблюдателей (паттерн Observer)
      eventBus.notify('FAVORITE_TOGGLED', { recipeId, isFavorited: !exists, recipe });
    },
    [favorites]
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    if (USE_MOCK) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* noop */
      }
    }
  }, []);

  const isFavorited = useCallback(
    (recipeId: string) => favorites.some((r) => r.id === recipeId),
    [favorites]
  );

  const value = useMemo<FavoritesContextType>(
    () => ({
      favorites,
      favoriteIds: favorites.map((r) => r.id),
      toggleFavorite,
      isFavorited,
      clearFavorites,
    }),
    [favorites, toggleFavorite, isFavorited, clearFavorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavoritesContext = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};
