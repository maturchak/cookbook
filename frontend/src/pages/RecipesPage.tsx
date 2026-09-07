import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Typography,
  Box,
  Button,
  Alert,
  Pagination,
  Skeleton,
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import RecipeCard from '../components/recipes/RecipeCard';
import { useRecipes } from '../hooks/useRecipes';
import { useDebounce } from '../hooks/useDebounce';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const categories = [
  'Все',
  'Завтрак',
  'Обед',
  'Ужин',
  'Десерт',
  'Супы',
  'Салаты',
  'Выпечка',
  'Напитки',
];

/**
 * Каталог рецептов: поиск, фильтры, пагинация.
 * Начальные значения фильтров можно передать через URL:
 * /recipes?search=суп или /recipes?category=Супы (ссылки с главной).
 */
export default function RecipesPage() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '');
  const [category, setCategory] = useState(() => {
    const fromUrl = searchParams.get('category');
    return fromUrl && categories.includes(fromUrl) ? fromUrl : 'Все';
  });
  const [ingredientSearch, setIngredientSearch] = useState('');

  useDocumentTitle('Рецепты');

  // Поиск с задержкой: не дёргаем фильтрацию на каждое нажатие клавиши
  const debouncedSearch = useDebounce(searchTerm, 300);
  const debouncedIngredients = useDebounce(ingredientSearch, 300);

  const ingredientList = useMemo(
    () =>
      debouncedIngredients
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean),
    [debouncedIngredients]
  );

  const isIngredientMode = ingredientList.length > 0;

  const { recipes, loading, error, total, totalPages, page, changePage, fetchRecipes } =
    useRecipes();

  useEffect(() => {
    fetchRecipes({
      search: debouncedSearch || undefined,
      category: category === 'Все' ? undefined : category,
      ingredients: ingredientList.length > 0 ? ingredientList : undefined,
    });
  }, [debouncedSearch, category, ingredientList, fetchRecipes]);

  const hasActiveFilters = Boolean(searchTerm || ingredientSearch || category !== 'Все');

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategory('Все');
    setIngredientSearch('');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          🍳 Что сегодня приготовим?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {total} рецептов в нашей коллекции
        </Typography>
      </Box>

      <TextField
        fullWidth
        label="Поиск рецептов"
        placeholder="Например: суп, рагу, блины..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <Button size="small" onClick={() => setSearchTerm('')} aria-label="Очистить поиск">
                <Clear fontSize="small" />
              </Button>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Поиск по ингредиентам"
        placeholder="Курица, рис, морковь — через запятую"
        value={ingredientSearch}
        onChange={(e) => setIngredientSearch(e.target.value)}
        size="small"
        sx={{ mb: 3 }}
        helperText="Найдутся рецепты, в которых есть хотя бы один из ингредиентов"
      />

      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        {categories.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            onClick={() => setCategory(cat)}
            color={category === cat ? 'primary' : 'default'}
            variant={category === cat ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
        ))}
        {hasActiveFilters && (
          <Button size="small" onClick={handleClearFilters} startIcon={<Clear />}>
            Сбросить
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isIngredientMode && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Найдено {total} рецептов с ингредиентами: {ingredientList.join(', ')}
        </Alert>
      )}

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Skeleton variant="rounded" height={340} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {recipes.map((recipe) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </Grid>
          ))}
        </Grid>
      )}

      {recipes.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            😢 Рецептов не найдено
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Попробуйте изменить параметры поиска
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={handleClearFilters}>
            Показать все рецепты
          </Button>
        </Box>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => changePage(value)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Container>
  );
}
