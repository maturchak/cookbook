import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  Chip,
  Button,
  Stack,
  ToggleButton,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  TextField,
  InputAdornment,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Snackbar,
  Alert,
  FormControlLabel,
} from '@mui/material';
import {
  CalendarToday,
  ShoppingCart,
  Add,
  Delete,
  AutoFixHigh,
} from '@mui/icons-material';
import { useRecipes } from '../hooks/useRecipes';
import { recipeService } from '../services/recipeService';
import { useAuth } from '../hooks/useAuth';
import { recipeStore } from '../services/recipeStore';
import { api } from '../services/api';
import { USE_MOCK } from '../services/useMock';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { eventBus } from '../services/EventBus';
import type { Observer, PlanUpdatedPayload } from '../services/EventBus';
import type { Recipe } from '../types';

const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Завтрак' },
  { key: 'lunch', label: 'Обед' },
  { key: 'dinner', label: 'Ужин' },
  { key: 'snack', label: 'Перекус' },
] as const;

type MealKey = (typeof MEAL_TYPES)[number]['key'];

const mealLabel = (key: string) =>
  MEAL_TYPES.find((m) => m.key === key)?.label ?? key;

interface PlanItem {
  id?: string;
  day: number;
  mealType: MealKey;
  recipeId: string;
  recipeTitle: string;
}

interface ShoppingItem {
  name: string;
  checked: boolean;
  /** 'auto' — добавлено из ингредиентов плана, 'manual' — вписано вручную */
  source: 'auto' | 'manual';
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'error';
}

const DEFAULT_SHOPPING: ShoppingItem[] = [
  { name: 'Куриное филе', checked: false, source: 'manual' },
  { name: 'Рис', checked: false, source: 'manual' },
];

function readPlan(): PlanItem[] {
  try {
    const saved = localStorage.getItem('cookbook:weeklyPlan');
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? (parsed as PlanItem[]) : [];
  } catch {
    return [];
  }
}

function readShoppingList(): ShoppingItem[] {
  try {
    const saved = localStorage.getItem('cookbook:shoppingList');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_SHOPPING;
    return Array.isArray(parsed) ? (parsed as ShoppingItem[]) : DEFAULT_SHOPPING;
  } catch {
    return DEFAULT_SHOPPING;
  }
}

export default function PlanPage() {
  const { recipes } = useRecipes();
  const { isAuthenticated } = useAuth();
  // Для автокомплита нужен полный список блюд, а не только текущая страница
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [mealType, setMealType] = useState<MealKey>('lunch');
  const [plan, setPlan] = useState<PlanItem[]>(() => (USE_MOCK ? readPlan() : []));
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(readShoppingList);
  const [newShoppingItem, setNewShoppingItem] = useState('');
  const [pickedRecipe, setPickedRecipe] = useState<Recipe | null>(null);
  const [autoSync, setAutoSync] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  useDocumentTitle('План питания');

  useEffect(() => {
    if (USE_MOCK) {
      setAllRecipes(recipeStore.all());
      return;
    }
    recipeService
      .getRecipes({ limit: 100 })
      .then((res) => setAllRecipes(res.recipes))
      .catch((err) => console.error('Не удалось загрузить рецепты', err));
  }, []);

  const notify = (message: string, severity: SnackbarState['severity'] = 'success') =>
    setSnackbar({ open: true, message, severity });

  // Реальный режим: план живёт на сервере
  useEffect(() => {
    if (USE_MOCK || !isAuthenticated) return;
    api
      .get<{ id: string; dayOfWeek: number; mealType: MealKey; recipeId: string; recipeTitle: string }[]>(
        '/plan'
      )
      .then((res) =>
        setPlan(
          res.data.map((item) => ({
            id: item.id,
            day: item.dayOfWeek,
            mealType: item.mealType,
            recipeId: item.recipeId,
            recipeTitle: item.recipeTitle,
          }))
        )
      )
      .catch((err) => console.error('Не удалось загрузить план', err));
  }, [isAuthenticated]);

  const savePlan = (next: PlanItem[]) => {
    setPlan(next);
    if (USE_MOCK) {
      localStorage.setItem('cookbook:weeklyPlan', JSON.stringify(next));
    } else {
      api
        .put('/plan', {
          items: next.map((item) => ({
            dayOfWeek: item.day,
            mealType: item.mealType,
            recipeId: item.recipeId,
          })),
        })
        .catch((err) => {
          console.error('Не удалось сохранить план', err);
          notify('Не удалось сохранить план', 'error');
        });
    }
    eventBus.notify('PLAN_UPDATED', { plan: next });
  };

  const saveShoppingList = (next: ShoppingItem[]) => {
    setShoppingList(next);
    localStorage.setItem('cookbook:shoppingList', JSON.stringify(next));
  };

  const addToPlan = (recipe: Recipe, day: number) => {
    const duplicate = plan.some(
      (item) => item.recipeId === recipe.id && item.day === day && item.mealType === mealType
    );
    if (duplicate) {
      notify(
        `«${recipe.title}» уже в плане: ${daysOfWeek[day]}, ${mealLabel(mealType).toLowerCase()}`,
        'info'
      );
      return;
    }

    savePlan([...plan, { day, mealType, recipeId: recipe.id, recipeTitle: recipe.title }]);
    notify(`Добавлено: ${recipe.title} — ${daysOfWeek[day]}, ${mealLabel(mealType).toLowerCase()}`);
  };

  const removeFromPlan = (itemToRemove: PlanItem) => {
    savePlan(plan.filter((item) => item !== itemToRemove));
  };

  const clearDay = () => {
    savePlan(plan.filter((item) => item.day !== selectedDay));
    notify(`День ${daysOfWeek[selectedDay]} очищен`, 'info');
  };

  /** Пересобирает «авто»-часть списка покупок из переданного плана. */
  const syncShoppingFromPlan = useCallback((planItems: PlanItem[]) => {
    setShoppingList((prev) => {
      const names = new Set<string>();
      planItems.forEach((item) => {
        const recipe = recipeStore.byId(item.recipeId);
        recipe?.ingredients.forEach((ing) => names.add(ing.ingredientName.trim()));
      });

      const previousChecked = new Map(
        prev.map((item) => [item.name.toLowerCase(), item.checked])
      );

      const auto: ShoppingItem[] = Array.from(names)
        .sort((a, b) => a.localeCompare(b, 'ru'))
        .map((name) => ({
          name,
          checked: previousChecked.get(name.toLowerCase()) ?? false,
          source: 'auto' as const,
        }));

      const manual = prev.filter((item) => item.source === 'manual');
      const next = [...auto, ...manual];
      try {
        localStorage.setItem('cookbook:shoppingList', JSON.stringify(next));
      } catch {
        /* localStorage недоступен */
      }
      return next;
    });
  }, []);

  /** Собирает список покупок из ингредиентов всех рецептов плана. */
  const buildShoppingListFromPlan = () => {
    syncShoppingFromPlan(plan);
    notify('Список покупок собран из плана');
  };

  // Observer: при включённом автосинхроне список покупок
  // сам реагирует на изменения плана через EventBus.
  useEffect(() => {
    if (!autoSync) return undefined;
    const observer: Observer<PlanUpdatedPayload> = {
      update: (_event, data) =>
        syncShoppingFromPlan(
          data.plan.map((p) => ({ ...p, day: p.day, mealType: p.mealType as MealKey }))
        ),
    };
    eventBus.subscribe('PLAN_UPDATED', observer);
    syncShoppingFromPlan(plan); // синхронизируем сразу при включении
    return () => eventBus.unsubscribe('PLAN_UPDATED', observer);
  }, [autoSync, syncShoppingFromPlan, plan]);

  const addShoppingItem = () => {
    const name = newShoppingItem.trim();
    if (!name) return;
    if (shoppingList.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      setNewShoppingItem('');
      return;
    }
    saveShoppingList([...shoppingList, { name, checked: false, source: 'manual' }]);
    setNewShoppingItem('');
  };

  const toggleShoppingItem = (index: number) => {
    const next = [...shoppingList];
    next[index] = { ...next[index], checked: !next[index].checked };
    saveShoppingList(next);
  };

  const removeShoppingItem = (index: number) => {
    saveShoppingList(shoppingList.filter((_, i) => i !== index));
  };

  const dayPlan = useMemo(
    () => plan.filter((item) => item.day === selectedDay),
    [plan, selectedDay]
  );

  const uncheckedCount = shoppingList.filter((item) => !item.checked).length;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
        >
          <CalendarToday sx={{ mr: 1 }} />
          План питания
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {plan.length} блюд запланировано на неделю
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 3, overflowX: 'auto' }}>
              {daysOfWeek.map((day, index) => {
                const count = plan.filter((p) => p.day === index).length;
                return (
                  <ToggleButton
                    key={day}
                    value={index}
                    selected={selectedDay === index}
                    onChange={() => setSelectedDay(index)}
                    sx={{ minWidth: 60 }}
                  >
                    <Stack alignItems="center">
                      <Typography variant="caption">{day}</Typography>
                      <Chip
                        label={count}
                        size="small"
                        color={count > 0 ? 'primary' : 'default'}
                        variant="outlined"
                        sx={{
                          mt: 0.5,
                          height: 20,
                          '& .MuiChip-label': { px: 1, fontSize: '0.6rem' },
                        }}
                      />
                    </Stack>
                  </ToggleButton>
                );
              })}
            </Stack>

            <Stack
              direction="row"
              spacing={2}
              sx={{ mb: 2, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
            >
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="meal-type-label">Приём пищи</InputLabel>
                <Select
                  labelId="meal-type-label"
                  label="Приём пищи"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealKey)}
                >
                  {MEAL_TYPES.map((type) => (
                    <MenuItem key={type.key} value={type.key}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ flexGrow: 1 }} />

              {dayPlan.length > 0 && (
                <Button size="small" color="error" onClick={clearDay}>
                  Очистить день
                </Button>
              )}
            </Stack>

            <Autocomplete
              size="small"
              options={allRecipes.length > 0 ? allRecipes : recipes}
              value={pickedRecipe}
              onChange={(_, recipe) => {
                if (recipe) addToPlan(recipe, selectedDay);
                setPickedRecipe(null);
              }}
              getOptionLabel={(option) => option.title}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText="Ничего не найдено"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Добавить любое блюдо"
                  placeholder="Начните вводить название рецепта..."
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>{option.title}</span>
                    <Chip label={option.category} size="small" variant="outlined" />
                  </Box>
                </li>
              )}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ mb: 2 }} />

            <Typography variant="h6" gutterBottom>
              {daysOfWeek[selectedDay]}
            </Typography>

            {dayPlan.length > 0 ? (
              <Stack spacing={2}>
                {dayPlan.map((item, index) => (
                  <Card key={`${item.recipeId}-${index}`} variant="outlined">
                    <CardContent
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        '&:last-child': { pb: 1 },
                      }}
                    >
                      <Box>
                        <Chip label={mealLabel(item.mealType)} size="small" sx={{ mr: 1 }} />
                        <Typography component="span">{item.recipeTitle}</Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => removeFromPlan(item)}
                        aria-label={`Убрать ${item.recipeTitle} из плана`}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 4, textAlign: 'center' }}
              >
                На этот день ничего не запланировано
              </Typography>
            )}
          </Paper>

          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Быстрое добавление
          </Typography>
          <Grid container spacing={2}>
            {recipes.slice(0, 4).map((recipe) => (
              <Grid item xs={12} sm={6} key={recipe.id}>
                <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {recipe.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {recipe.cookingTime} мин
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => addToPlan(recipe, selectedDay)}
                  >
                    Добавить
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Stack direction="row" sx={{ alignItems: 'center', mb: 1 }} spacing={1}>
              <ShoppingCart />
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Список покупок
              </Typography>
              <Tooltip title="Собрать список из ингредиентов плана">
                {/* span нужен, чтобы Tooltip работал на disabled-кнопке */}
                <Box component="span">
                  <IconButton
                    onClick={buildShoppingListFromPlan}
                    disabled={plan.length === 0}
                    size="small"
                    aria-label="Собрать список покупок из плана"
                  >
                    <AutoFixHigh fontSize="small" />
                  </IconButton>
                </Box>
              </Tooltip>
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              {uncheckedCount} к покупке · {shoppingList.length - uncheckedCount} куплено
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                />
              }
              label={<Typography variant="caption">Автообновление из плана</Typography>}
              sx={{ mb: 1, ml: 0 }}
            />

            <TextField
              size="small"
              fullWidth
              placeholder="Добавить продукт"
              value={newShoppingItem}
              onChange={(e) => setNewShoppingItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addShoppingItem();
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={addShoppingItem}
                      size="small"
                      aria-label="Добавить продукт"
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />

            <List dense>
              {shoppingList.map((item, index) => (
                <ListItem
                  key={`${item.name}-${index}`}
                  dense
                  sx={{ px: 0 }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => removeShoppingItem(index)}
                      aria-label={`Удалить ${item.name}`}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  }
                >
                  <Checkbox
                    checked={item.checked}
                    onChange={() => toggleShoppingItem(index)}
                    size="small"
                  />
                  <ListItemText
                    primary={item.name}
                    sx={{
                      textDecoration: item.checked ? 'line-through' : 'none',
                      color: item.checked ? 'text.secondary' : 'inherit',
                      pr: 4,
                    }}
                  />
                </ListItem>
              ))}
            </List>

            {shoppingList.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                Список пуст. Добавьте продукты вручную или соберите из плана (✨).
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
