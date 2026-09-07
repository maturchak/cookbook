/**
 * Флаг мок-режима. Управляется переменной окружения VITE_USE_MOCK.
 * По умолчанию (если переменная не задана) — true, чтобы проект
 * работал «из коробки» без бэкенда.
 */
export const USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK !== 'false';
