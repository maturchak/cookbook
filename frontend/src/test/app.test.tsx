import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderHook } from '@testing-library/react';
import { authService } from '../services/authService';
import { recipeService } from '../services/recipeService';
import { recipeStore } from '../services/recipeStore';
import { useRecipes } from '../hooks/useRecipes';
import { useDebounce } from '../hooks/useDebounce';
import { useFavorites } from '../hooks/useFavorites';
import HomePage from '../pages/HomePage';
import RecipesPage from '../pages/RecipesPage';
import LoginPage from '../pages/LoginPage';
import PlanPage from '../pages/PlanPage';
import RecipeCard from '../components/recipes/RecipeCard';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import type { Recipe } from '../types';

/** Общая обёртка: те же провайдеры, что и в App.tsx */
function renderWithProviders(ui: React.ReactElement, route = '/') {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  recipeStore.reset();
});

describe('authService (mock-режим)', () => {
  it('пускает демо-пользователя и выдаёт токен', async () => {
    const res = await authService.login({ email: 'demo@cookbook.com', password: 'demo123' });
    expect(res.user.email).toBe('demo@cookbook.com');
    expect(res.token).toMatch(/^mock\./);
  });

  it('отклоняет неверный пароль', async () => {
    await expect(
      authService.login({ email: 'demo@cookbook.com', password: 'wrong' })
    ).rejects.toThrow('Неверный email или пароль');
  });

  it('регистрирует нового пользователя', async () => {
    const res = await authService.register({
      name: 'Тест',
      email: 'Test@Cookbook.com',
      password: 'secret123',
    });
    expect(res.user.name).toBe('Тест');
    expect(res.user.email).toBe('test@cookbook.com');
  });
});

describe('recipeStore', () => {
  it('созданный рецепт переживает «перезагрузку» (localStorage)', () => {
    recipeStore.add({
      id: 'x1',
      title: 'Тестовый',
      description: '',
      category: 'Супы',
      cookingTime: 10,
      servings: 1,
      imageUrl: '',
      rating: 0,
      authorId: '1',
      authorName: 'Тест',
      ingredients: [],
      steps: [],
      createdAt: '',
      updatedAt: '',
    });

    expect(recipeStore.byId('x1')?.title).toBe('Тестовый');
    expect(JSON.parse(localStorage.getItem('cookbook:recipes:v3') || '[]')).toHaveLength(13);

    recipeStore.reset();
    expect(recipeStore.all()).toHaveLength(12);
  });
});

describe('recipeService (mock-режим)', () => {
  it('возвращает список рецептов и фильтрует по категории', async () => {
    const all = await recipeService.getRecipes();
    expect(all.recipes.length).toBeGreaterThanOrEqual(3);

    const soups = await recipeService.getRecipes({ category: 'Супы' });
    expect(soups.recipes.every((r: Recipe) => r.category === 'Супы')).toBe(true);
    expect(soups.recipes.length).toBe(3);
  });

  it('находит рецепт по id и возвращает null для несуществующего', async () => {
    const recipe = await recipeService.getRecipeById('1');
    expect(recipe?.title).toBe('Куриный суп с рисом');
    expect(await recipeService.getRecipeById('999')).toBeNull();
  });
});

describe('useRecipes', () => {
  it('загружает рецепты и ищет по ингредиенту', async () => {
    const { result } = renderHook(() => useRecipes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.total).toBe(12);

    act(() => {
      result.current.searchByIngredients(['свёкла']);
    });
    await waitFor(() => expect(result.current.recipes.length).toBe(1));
    expect(result.current.recipes[0].title).toBe('Борщ с говядиной');

    act(() => {
      result.current.searchByIngredients(['картофель']);
    });
    await waitFor(() => expect(result.current.recipes.length).toBe(4));
  });
});

describe('useDebounce', () => {
  it('отдаёт новое значение только после задержки', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'abc' });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('abc');
    vi.useRealTimers();
  });
});

describe('избранное синхронизируется через контекст', () => {
  it('toggleFavorite добавляет рецепт, повторный вызов — убирает', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </AuthProvider>
    );
    const { result } = renderHook(() => useFavorites(), { wrapper });
    const recipeId = recipeStore.all()[0].id;

    expect(result.current.isFavorited(recipeId)).toBe(false);

    act(() => result.current.toggleFavorite(recipeId));
    expect(result.current.isFavorited(recipeId)).toBe(true);
    expect(result.current.favorites).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('cookbook:favorites:v3') || '[]')).toHaveLength(1);

    act(() => result.current.toggleFavorite(recipeId));
    expect(result.current.isFavorited(recipeId)).toBe(false);
    expect(result.current.favorites).toHaveLength(0);
  });

  it('состояние избранное разделяют все потребители контекста', () => {
    function Probe() {
      const { favoriteIds } = useFavorites();
      return <div data-testid="probe">{favoriteIds.join(',')}</div>;
    }
    function Toggle() {
      const { toggleFavorite } = useFavorites();
      return (
        <button type="button" onClick={() => toggleFavorite('2')}>
          toggle
        </button>
      );
    }

    render(
      <AuthProvider>
        <FavoritesProvider>
          <Probe />
          <Toggle />
        </FavoritesProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId('probe')).toHaveTextContent('');
    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('probe')).toHaveTextContent('2');
  });

  it('карточка авторизованного пользователя показывает кнопку избранного', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: '1', email: 'demo@cookbook.com', name: 'Демо' })
    );
    localStorage.setItem('token', 'mock.test.signature');

    const recipe = recipeStore.all()[0];
    renderWithProviders(<RecipeCard recipe={recipe} />);

    expect(
      screen.getByRole('button', { name: /добавить в избранное/i })
    ).toBeInTheDocument();
  });
});

describe('страницы рендерятся', () => {
  it('RecipesPage показывает карточки рецептов', async () => {
    renderWithProviders(<RecipesPage />);

    expect(await screen.findByText('Куриный суп с рисом')).toBeInTheDocument();
    expect(screen.getByText(/рецептов в нашей коллекции/)).toBeInTheDocument();
  });

  it('RecipesPage фильтрует по категории «Супы»', async () => {
    renderWithProviders(<RecipesPage />);
    await screen.findByText('Куриный суп с рисом');

    // Кликаем именно по чипу-фильтру (MUI Chip с onClick — это button),
    // а не по тексту «Супы» в названии рецепта
    fireEvent.click(screen.getByRole('button', { name: 'Супы' }));

    await waitFor(() =>
      expect(screen.queryByText('Овощное рагу с курицей')).not.toBeInTheDocument()
    );
    expect(screen.getByText('Сырный суп с картофелем')).toBeInTheDocument();
  });

  it('LoginPage показывает форму входа', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
    expect(screen.getByText(/Демо-аккаунт/i)).toBeInTheDocument();
  });

  it('устанавливает заголовок вкладки', async () => {
    renderWithProviders(<RecipesPage />);
    await screen.findByText('Куриный суп с рисом');
    expect(document.title).toBe('Рецепты — CookBook');
  });

  it('RecipesPage подхватывает категорию из URL', async () => {
    renderWithProviders(<RecipesPage />, '/recipes?category=Супы');
    await screen.findByText('Сырный суп с картофелем');
    // из URL пришёл фильтр: блюда других категорий не показаны
    expect(screen.queryByText('Овощное рагу с курицей')).not.toBeInTheDocument();
  });

  it('Главная показывает приветствие, категории и подборки', async () => {
    renderWithProviders(<HomePage />);

    expect(await screen.findByText(/Добр(ое|ый|ой)/)).toBeInTheDocument();
    expect(screen.getByText('🍳 Что сегодня приготовим?')).toBeInTheDocument();
    // категории-плитки
    expect(await screen.findByText('Супы')).toBeInTheDocument();
    expect(screen.getByText('Выпечка')).toBeInTheDocument();
    // подборки появляются после загрузки
    expect(await screen.findByText('⭐ Лучшие рецепты')).toBeInTheDocument();
    expect(screen.getByText('🆕 Недавно добавленные')).toBeInTheDocument();
    // в подборке «Лучшие» — рецепт с максимальным рейтингом из хранилища
    const topRecipe = [...recipeStore.all()].sort((a, b) => b.rating - a.rating)[0];
    expect(await screen.findByText(topRecipe.title)).toBeInTheDocument();
    expect(document.title).toBe('Главная — CookBook');
  });
});

describe('PlanPage', () => {
  it('позволяет добавить любое блюдо через автокомплит', async () => {
    renderWithProviders(<PlanPage />);

    // дожидаемся загрузки рецептов (появляются карточки быстрого добавления)
    await screen.findByText('Куриный суп с рисом');

    const input = screen.getByLabelText(/Добавить любое блюдо/);
    fireEvent.change(input, { target: { value: 'морс' } });

    // «Клюквенный морс» не входит в блок быстрого добавления (slice(0,4)),
    // значит попасть в план он может только через полный список
    const option = await screen.findByRole('option', { name: /Клюквенный морс/ });
    fireEvent.click(option);

    expect(await screen.findByText(/Добавлено: Клюквенный морс/)).toBeInTheDocument();
    expect(screen.getByText('Клюквенный морс')).toBeInTheDocument();
  });

  it('автосинхронизация списка покупок реагирует на план (Observer)', async () => {
    renderWithProviders(<PlanPage />);
    await screen.findByText('Куриный суп с рисом');

    fireEvent.click(screen.getByLabelText(/Автообновление из плана/));

    const input = screen.getByLabelText(/Добавить любое блюдо/);
    fireEvent.change(input, { target: { value: 'борщ' } });
    fireEvent.click(await screen.findByRole('option', { name: /Борщ с говядиной/ }));

    // ингредиент борща появляется в списке покупок без ручного нажатия ✨
    expect(await screen.findByText('Свёкла')).toBeInTheDocument();
  });

  it('не даёт задублировать блюдо в тот же приём пищи', async () => {
    renderWithProviders(<PlanPage />);
    await screen.findByText('Куриный суп с рисом');

    const input = screen.getByLabelText(/Добавить любое блюдо/);
    fireEvent.change(input, { target: { value: 'борщ' } });
    fireEvent.click(await screen.findByRole('option', { name: /Борщ с говядиной/ }));
    await screen.findByText(/Добавлено: Борщ/);

    fireEvent.change(input, { target: { value: 'борщ' } });
    fireEvent.click(await screen.findByRole('option', { name: /Борщ с говядиной/ }));
    expect(await screen.findByText(/уже в плане/)).toBeInTheDocument();
  });
});
