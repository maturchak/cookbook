/**
 * Тонкая обёртка над FavoritesContext.
 * Хранится как отдельный хук, чтобы компоненты не зависели от пути контекста.
 */
import { useFavoritesContext } from '../contexts/FavoritesContext';

export const useFavorites = useFavoritesContext;
