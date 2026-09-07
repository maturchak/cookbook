import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Grid,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add,
  CalendarToday,
  Favorite,
  Restaurant,
  Search,
  Star,
} from '@mui/icons-material';
import RecipeCard from '../components/recipes/RecipeCard';
import { recipeService } from '../services/recipeService';
import { api } from '../services/api';
import { USE_MOCK } from '../services/useMock';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { Recipe } from '../types';

const CATEGORIES = [
  { name: 'Завтрак', emoji: '🍳' },
  { name: 'Обед', emoji: '🍲' },
  { name: 'Ужин', emoji: '🍽️' },
  { name: 'Десерт', emoji: '🍰' },
  { name: 'Супы', emoji: '🥣' },
  { name: 'Салаты', emoji: '🥗' },
  { name: 'Выпечка', emoji: '🥐' },
  { name: 'Напитки', emoji: '🥤' },
];

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

interface TodayMeal {
  mealType: string;
  recipeTitle: string;
}

/** Пн = 0 ... Вс = 6 — так день недели хранится в плане */
const todayIndex = () => (new Date().getDay() + 6) % 7;

const greeting = () => {
  const h = new Date().getHours();
  if (h < 6) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
};

/**
 * Главная-дашборд: приветствие, быстрый поиск, статистика, категории,
 * лучшие и свежие рецепты, план на сегодня. Каталог — на /recipes.
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites } = useFavorites();

  const [quickSearch, setQuickSearch] = useState('');
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayMeals, setTodayMeals] = useState<TodayMeal[]>([]);

  useDocumentTitle('Главная');

  // Рецепты для статистики и подборок (в обоих режимах — одним запросом)
  useEffect(() => {
    let cancelled = false;
    recipeService
      .getRecipes({ limit: 100 })
      .then((result) => {
        if (cancelled) return;
        setAllRecipes(result.recipes);
        setTotal(result.total);
      })
      .catch(() => !cancelled && setError('Не удалось загрузить рецепты'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // План на сегодня: в mock-режиме — localStorage, иначе — сервер
  useEffect(() => {
    let cancelled = false;
    const apply = (items: { day: number; mealType: string; recipeTitle: string }[]) => {
      if (!cancelled) setTodayMeals(items.filter((i) => i.day === todayIndex()));
    };
    if (USE_MOCK) {
      try {
        const saved = localStorage.getItem('cookbook:weeklyPlan');
        const parsed = saved ? JSON.parse(saved) : [];
        apply(Array.isArray(parsed) ? parsed : []);
      } catch {
        apply([]);
      }
    } else {
      api
        .get<{ dayOfWeek: number; mealType: string; recipeTitle: string }[]>('/plan')
        .then((res) =>
          apply(
            res.data.map((i) => ({
              day: i.dayOfWeek,
              mealType: i.mealType,
              recipeTitle: i.recipeTitle,
            }))
          )
        )
        .catch(() => apply([])); // карточка некритичная — оставим пустой
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const topRecipes = useMemo(
    () => [...allRecipes].sort((a, b) => b.rating - a.rating).slice(0, 4),
    [allRecipes]
  );

  const newestRecipes = useMemo(
    () =>
      [...allRecipes]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    [allRecipes]
  );

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = quickSearch.trim();
    navigate(query ? `/recipes?search=${encodeURIComponent(query)}` : '/recipes');
  };

  const stats = [
    { label: 'Рецептов', value: total, icon: <Restaurant color="primary" /> },
    { label: 'Категорий', value: CATEGORIES.length, icon: <Star color="primary" /> },
    { label: 'В избранном', value: favorites.length, icon: <Favorite color="error" /> },
    { label: 'Блюд на сегодня', value: todayMeals.length, icon: <CalendarToday color="success" /> },
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero: приветствие + быстрый поиск на мягком градиенте */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: (t) =>
            t.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(230,126,34,0.10) 0%, rgba(39,174,96,0.07) 100%)'
              : 'linear-gradient(135deg, rgba(230,126,34,0.14) 0%, rgba(39,174,96,0.10) 100%)',
        }}
      >
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {greeting()}, {user?.name || 'друг'}!
        </Typography>
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          🍳 Что сегодня приготовим?
        </Typography>

        <Box component="form" onSubmit={handleQuickSearch}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              fullWidth
              placeholder="Найти рецепт: суп, блины, рагу..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              sx={{ bgcolor: 'background.paper', borderRadius: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" variant="contained" size="large" sx={{ minWidth: 140 }}>
              Найти
            </Button>
          </Stack>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Статистика */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {stats.map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  borderRadius: 2.5,
                  bgcolor: 'action.hover',
                }}
              >
                {s.icon}
              </Box>
              <Box>
                <Typography variant="h5" sx={{ lineHeight: 1.2 }}>
                  {loading && s.label === 'Рецептов' ? '…' : s.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* План на сегодня */}
      <Paper sx={{ p: 2.5, mb: 4 }} variant="outlined">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              📅 План на сегодня
            </Typography>
            {todayMeals.length > 0 ? (
              <Stack spacing={0.5}>
                {todayMeals.map((meal, i) => (
                  <Typography key={`${meal.recipeTitle}-${i}`} variant="body2">
                    <strong>{MEAL_LABELS[meal.mealType] ?? meal.mealType}:</strong>{' '}
                    {meal.recipeTitle}
                  </Typography>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                На сегодня ничего не запланировано — самое время выбрать блюдо!
              </Typography>
            )}
          </Box>
          <Button
            variant="outlined"
            startIcon={<CalendarToday />}
            onClick={() => navigate('/plan')}
          >
            {todayMeals.length > 0 ? 'Открыть план' : 'Составить план'}
          </Button>
        </Stack>
      </Paper>

      {/* Категории */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Категории
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {CATEGORIES.map((cat) => (
          <Grid item xs={6} sm={4} md={3} key={cat.name}>
            <Card>
              <CardActionArea onClick={() => navigate(`/recipes?category=${encodeURIComponent(cat.name)}`)}>
                <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                  <Typography variant="h3" sx={{ mb: 0.5 }}>
                    {cat.emoji}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {cat.name}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Лучшие рецепты */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          ⭐ Лучшие рецепты
        </Typography>
        <Button onClick={() => navigate('/recipes')}>Все рецепты →</Button>
      </Stack>
      {loading ? (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rounded" height={340} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {topRecipes.map((recipe) => (
            <Grid item xs={12} sm={6} md={3} key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Недавно добавленные */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        🆕 Недавно добавленные
      </Typography>
      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rounded" height={340} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3} sx={{ mb: 2 }}>
          {newestRecipes.map((recipe) => (
            <Grid item xs={12} sm={6} md={3} key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          startIcon={<Add />}
          onClick={() => navigate('/recipe/new')}
        >
          Добавить свой рецепт
        </Button>
      </Box>
    </Container>
  );
}
