import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Stack,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import { Add, Delete, PhotoCamera } from '@mui/icons-material';
import { Recipe } from '../../types';
import { api } from '../../services/api';
import { USE_MOCK } from '../../services/useMock';

const categories = ['Завтрак', 'Обед', 'Ужин', 'Десерт', 'Супы', 'Салаты', 'Выпечка', 'Напитки'];
const units = ['г', 'кг', 'мл', 'л', 'шт', 'ст.л.', 'ч.л.', 'щепотка'];

export interface RecipeFormValues {
  title: string;
  description: string;
  category: string;
  cookingTime: number;
  servings: number;
  imageUrl?: string;
  ingredients: Recipe['ingredients'];
  steps: string[];
}

interface RecipeFormProps {
  initialData?: Partial<Recipe>;
  onSubmit: (data: RecipeFormValues) => void;
  isLoading?: boolean;
}

export default function RecipeForm({ initialData, onSubmit, isLoading = false }: RecipeFormProps) {
  const navigate = useNavigate();

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || categories[0]);
  const [cookingTime, setCookingTime] = useState<number>(initialData?.cookingTime || 30);
  const [servings, setServings] = useState<number>(initialData?.servings || 2);
  const [ingredients, setIngredients] = useState<{ name: string; quantity: string; unit: string }[]>(
    initialData?.ingredients?.map((i) => ({
      name: i.ingredientName,
      quantity: i.quantity,
      unit: i.unit,
    })) || [{ name: '', quantity: '', unit: 'г' }]
  );
  const [steps, setSteps] = useState<string[]>(initialData?.steps || ['']);
  const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await api.post<{ url: string }>('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(res.data.url);
    } catch {
      setError('Не удалось загрузить фото');
    } finally {
      setUploading(false);
    }
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: 'г' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleIngredientChange = (
    index: number,
    field: 'name' | 'quantity' | 'unit',
    value: string
  ) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const handleStepChange = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Введите название рецепта');
      return;
    }
    if (ingredients.some((i) => !i.name.trim())) {
      setError('Заполните все ингредиенты');
      return;
    }
    if (steps.some((s) => !s.trim())) {
      setError('Заполните все шаги приготовления');
      return;
    }

    setError(null);

    onSubmit({
      title,
      description,
      category,
      cookingTime,
      servings,
      imageUrl: imageUrl || undefined,
      ingredients: ingredients.map((i) => ({
        ingredientId: '',
        ingredientName: i.name,
        quantity: i.quantity || '1',
        unit: i.unit || 'г',
      })),
      steps: steps.filter((s) => s.trim()),
    });
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 4 }, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        {initialData?.id ? 'Редактировать рецепт' : 'Создать новый рецепт'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
          Основная информация
        </Typography>

        <TextField
          fullWidth
          label="Название рецепта"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Описание"
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Краткое описание блюда..."
          sx={{ mb: 2 }}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            select
            fullWidth
            label="Категория"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="number"
            label="Время (мин)"
            value={cookingTime}
            onChange={(e) => setCookingTime(Number(e.target.value))}
            inputProps={{ min: 1 }}
          />
          <TextField
            type="number"
            label="Порции"
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            inputProps={{ min: 1 }}
          />
        </Stack>

        {!USE_MOCK && (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<PhotoCamera />}
              disabled={uploading}
            >
              {uploading ? 'Загрузка...' : imageUrl ? 'Заменить фото' : 'Прикрепить фото'}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
            </Button>
            {imageUrl && (
              <Box
                component="img"
                src={imageUrl}
                alt="Превью фото"
                sx={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 1 }}
              />
            )}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Ингредиенты
          </Typography>
          <Button startIcon={<Add />} onClick={handleAddIngredient} size="small">
            Добавить
          </Button>
        </Box>

        {ingredients.map((ing, index) => (
          <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Название ингредиента"
              value={ing.name}
              onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
            />
            <TextField
              size="small"
              placeholder="Кол-во"
              value={ing.quantity}
              onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
              sx={{ width: { xs: '100%', sm: 120 } }}
            />
            <TextField
              select
              size="small"
              value={ing.unit}
              onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
              sx={{ width: { xs: '100%', sm: 100 } }}
            >
              {units.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unit}
                </MenuItem>
              ))}
            </TextField>
            <IconButton
              onClick={() => handleRemoveIngredient(index)}
              color="error"
              size="small"
            >
              <Delete />
            </IconButton>
          </Stack>
        ))}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Шаги приготовления
          </Typography>
          <Button startIcon={<Add />} onClick={handleAddStep} size="small">
            Добавить шаг
          </Button>
        </Box>

        {steps.map((step, index) => (
          <Stack key={index} direction="row" spacing={1} sx={{ mb: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={`Шаг ${index + 1}`}
              value={step}
              onChange={(e) => handleStepChange(index, e.target.value)}
              multiline
              rows={2}
            />
            <IconButton
              onClick={() => handleRemoveStep(index)}
              color="error"
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            >
              <Delete />
            </IconButton>
          </Stack>
        ))}

        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button variant="contained" type="submit" disabled={isLoading} sx={{ minWidth: 150 }}>
            {isLoading ? 'Сохранение...' : initialData?.id ? 'Сохранить' : 'Опубликовать'}
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Отмена
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
