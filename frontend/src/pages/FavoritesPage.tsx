import React from 'react';
import { Container, Typography, Grid, Box, Paper } from '@mui/material';
import { Favorite } from '@mui/icons-material';
import RecipeCard from '../components/recipes/RecipeCard';
import { useFavorites } from '../hooks/useFavorites';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  useDocumentTitle('Избранное');

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
        >
          <Favorite sx={{ color: 'error.main', mr: 1 }} />
          Избранное
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {favorites.length} рецептов в избранном
        </Typography>
      </Box>

      {favorites.length > 0 ? (
        <Grid container spacing={3}>
          {favorites.map((recipe) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            💔 Избранное пусто
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Начните добавлять рецепты в избранное
          </Typography>
        </Paper>
      )}
    </Container>
  );
}
