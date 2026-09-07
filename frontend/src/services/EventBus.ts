import type { Recipe } from '../types';

/**
 * Паттерн Observer (Наблюдатель).
 * EventBus — Subject/издатель: компоненты публикуют события,
 * наблюдатели подписываются и реагируют без прямой связи между собой.
 */

export type AppEvent = 'FAVORITE_TOGGLED' | 'PLAN_UPDATED';

export interface FavoriteToggledPayload {
  recipeId: string;
  isFavorited: boolean;
  recipe: Recipe | null;
}

export interface PlanUpdatedPayload {
  plan: { day: number; mealType: string; recipeId: string; recipeTitle: string }[];
}

export type EventPayload = FavoriteToggledPayload | PlanUpdatedPayload;

export interface Observer<T extends EventPayload = EventPayload> {
  update(event: AppEvent, data: T): void;
}

class EventBus {
  private static instance: EventBus | null = null;
  private observers: Map<AppEvent, Observer[]> = new Map();

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  subscribe<T extends EventPayload>(event: AppEvent, observer: Observer<T>): void {
    const list = this.observers.get(event) ?? [];
    if (!list.includes(observer as Observer)) {
      list.push(observer as Observer);
    }
    this.observers.set(event, list);
  }

  unsubscribe<T extends EventPayload>(event: AppEvent, observer: Observer<T>): void {
    const list = this.observers.get(event);
    if (!list) return;
    this.observers.set(
      event,
      list.filter((obs) => obs !== observer)
    );
  }

  notify<T extends EventPayload>(event: AppEvent, data: T): void {
    const list = this.observers.get(event);
    if (!list) return;
    // копия списка: подписчик может отписаться во время оповещения
    [...list].forEach((observer) => observer.update(event, data));
  }

  /** Для тестов: полное снятие подписок. */
  clear(): void {
    this.observers.clear();
  }

  listenerCount(event: AppEvent): number {
    return this.observers.get(event)?.length ?? 0;
  }
}

export const eventBus = EventBus.getInstance();
