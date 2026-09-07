import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Alert } from '@mui/material';
import RecipeForm, { type RecipeFormValues } from '../components/recipes/RecipeForm';
import { recipeService } from '../services/recipeService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function CreateRecipePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useDocumentTitle('Новый рецепт');

  const handleSubmit = async (data: RecipeFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const newRecipe = await recipeService.createRecipe(data);
      navigate(`/recipe/${newRecipe.id}`);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err instanceof Error ? err.message : '') ||
        'Ошибка при создании рецепта';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        📝 Создать рецепт
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Поделитесь своим кулинарным мастерством с сообществом
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <RecipeForm onSubmit={handleSubmit} isLoading={isLoading} />
    </Container>
  );
}
