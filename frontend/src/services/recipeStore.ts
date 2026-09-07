import { mockRecipes as seedRecipes } from './mockData';
import type { Recipe } from '../types';

const STORAGE_KEY = 'cookbook:recipes:v3';

/**
 * Единый источник рецептов для mock-режима.
 * Данные переживают перезагрузку страницы (localStorage),
 * но их всегда можно сбросить в исходное состояние.
 * Версия в ключе позволяет инвалидировать устаревший кеш
 * (например, когда в мок-данных сменились ссылки на картинки).
 */
function readStore(): Recipe[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [...seedRecipes];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as Recipe[]) : [...seedRecipes];
  } catch {
    return [...seedRecipes];
  }
}

let store: Recipe[] = readStore();

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage может быть недоступен (приватный режим) — работаем в памяти
  }
}

export const recipeStore = {
  all(): Recipe[] {
    return store;
  },

  byId(id: string): Recipe | undefined {
    return store.find((r) => r.id === id);
  },

  add(recipe: Recipe): Recipe {
    store = [recipe, ...store];
    persist();
    return recipe;
  },

  update(id: string, patch: Partial<Recipe>): Recipe {
    const index = store.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Recipe not found');
    const updated = { ...store[index], ...patch, updatedAt: new Date().toISOString() };
    store = store.map((r) => (r.id === id ? updated : r));
    persist();
    return updated;
  },

  remove(id: string): void {
    const index = store.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Recipe not found');
    store = store.filter((r) => r.id !== id);
    persist();
  },

  /** Вернуть мок-данные к исходному состоянию (полезно в разработке и тестах). */
  reset(): void {
    store = [...seedRecipes];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  },
};
