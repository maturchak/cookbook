import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Box, Alert, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import RecipeDetail from '../components/recipes/RecipeDetail';
import { recipeService } from '../services/recipeService';
import { Recipe } from '../types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle(recipe ? recipe.title : 'Рецепт');

  useEffect(() => {
    const loadRecipe = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await recipeService.getRecipeById(id);
        if (data) {
          setRecipe(data);
        } else {
          setError('Рецепт не найден');
        }
      } catch {
        setError('Ошибка загрузки рецепта');
      } finally {
        setLoading(false);
      }
    };
    loadRecipe();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !recipe) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'Рецепт не найден'}
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} sx={{ mt: 2 }} onClick={() => navigate('/')}>
          На главную
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
        Назад
      </Button>
      <RecipeDetail recipe={recipe} />
    </Container>
  );
}
