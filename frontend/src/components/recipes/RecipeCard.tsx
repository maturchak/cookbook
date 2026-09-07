import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Box,
  Rating,
  Tooltip,
} from '@mui/material';
import { Favorite, FavoriteBorder, AccessTime, Person } from '@mui/icons-material';
import ImageWithFallback from '../common/ImageWithFallback';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../hooks/useFavorites';
import { Recipe } from '../../types';

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();

  const handleClick = () => navigate(`/recipe/${recipe.id}`);
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(recipe.id, recipe);
  };

  const isFav = isFavorited(recipe.id);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
      onClick={handleClick}
    >
      <Box sx={{ position: 'relative' }}>
        <ImageWithFallback
          src={recipe.imageUrl}
          alt={recipe.title}
          height={200}
        />
        <Chip
          label={recipe.category}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            bgcolor: 'rgba(0,0,0,0.55)',
            color: 'white',
            fontWeight: 500,
            backdropFilter: 'blur(4px)',
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, px: 2, pt: 1.75, pb: 1 }}>
        <Typography variant="h6" noWrap sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
          {recipe.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTime fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {recipe.cookingTime} мин
            </Typography>
          </Box>
          <Rating value={recipe.rating} readOnly size="small" precision={0.5} />
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {recipe.description}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', pt: 0, px: 2, pb: 1.5 }}>
        <Tooltip title={recipe.authorName || 'Анонимный автор'}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Person sx={{ fontSize: 14, mr: 0.5 }} />
            {recipe.authorName || 'Аноним'}
          </Typography>
        </Tooltip>
        {isAuthenticated && (
          <Tooltip title={isFav ? 'Удалить из избранного' : 'Добавить в избранное'}>
            <IconButton onClick={handleFavorite} size="small" color={isFav ? 'error' : 'default'}>
              {isFav ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
}
