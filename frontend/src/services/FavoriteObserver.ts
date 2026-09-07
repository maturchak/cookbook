import type { Observer, FavoriteToggledPayload, PlanUpdatedPayload } from './EventBus';
import type { Recipe } from '../types';

const MIRROR_KEY = 'cookbook:favoritesMirror';

function readMirror(): Recipe[] {
  try {
    const saved = localStorage.getItem(MIRROR_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? (parsed as Recipe[]) : [];
  } catch {
    return [];
  }
}

/**
 * Наблюдатель за избранным и планом питания.
 * Держит «зеркало» избранного и реагирует на обновление плана —
 * FavoritesContext и PlanPage ничего не знают о нём напрямую (слабая связь).
 */
export class FavoriteObserver implements Observer {
  private favorites: Recipe[] = readMirror();

  update(event: string, data: FavoriteToggledPayload | PlanUpdatedPayload): void {
    if (event === 'FAVORITE_TOGGLED') {
      const payload = data as FavoriteToggledPayload;
      if (payload.isFavorited && payload.recipe) {
        if (!this.favorites.some((r) => r.id === payload.recipeId)) {
          this.favorites.push(payload.recipe);
        }
        console.log(`❤️ Рецепт «${payload.recipe.title}» добавлен в избранное`);
      } else {
        this.favorites = this.favorites.filter((r) => r.id !== payload.recipeId);
        console.log(`💔 Рецепт удалён из избранного: ${payload.recipeId}`);
      }
      this.persist();
    }

    if (event === 'PLAN_UPDATED') {
      const payload = data as PlanUpdatedPayload;
      console.log(`📅 План питания обновлён: блюд в плане — ${payload.plan.length}`);
    }
  }

  getFavorites(): Recipe[] {
    return this.favorites;
  }

  isFavorited(recipeId: string): boolean {
    return this.favorites.some((r) => r.id === recipeId);
  }

  private persist(): void {
    try {
      localStorage.setItem(MIRROR_KEY, JSON.stringify(this.favorites));
    } catch {
      /* localStorage недоступен */
    }
  }
}

/** Единственный экземпляр наблюдателя на всё приложение. */
export const favoriteObserver = new FavoriteObserver();
