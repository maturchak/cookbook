import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Rating,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Avatar,
  Stack,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  AccessTime,
  People,
  Favorite,
  FavoriteBorder,
  Send,
  StarBorder,
} from '@mui/icons-material';
import ImageWithFallback from '../common/ImageWithFallback';
import { Recipe, Comment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../hooks/useFavorites';
import { recipeService } from '../../services/recipeService';

interface RecipeDetailProps {
  recipe: Recipe;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

export default function RecipeDetail({ recipe }: RecipeDetailProps) {
  const { isAuthenticated, user } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const isFav = isFavorited(recipe.id);

  const loadComments = useCallback(async (recipeId: string) => {
    setLoading(true);
    try {
      const data = await recipeService.getComments(recipeId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComments(recipe.id);
  }, [recipe.id, loadComments]);

  const handleAddComment = async () => {
    if (!isAuthenticated) {
      setSnackbar({ open: true, message: 'Войдите, чтобы оставить комментарий', severity: 'error' });
      return;
    }
    if (!newComment.trim()) {
      setSnackbar({ open: true, message: 'Введите текст комментария', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const comment = await recipeService.addComment(recipe.id, newComment);
      setComments([comment, ...comments]);
      setNewComment('');
      setSnackbar({ open: true, message: 'Комментарий добавлен', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Ошибка при добавлении комментария', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (value: number | null) => {
    if (!isAuthenticated) {
      setSnackbar({ open: true, message: 'Войдите, чтобы оценить рецепт', severity: 'error' });
      return;
    }
    setRating(value);
    try {
      await recipeService.rateRecipe(recipe.id, value || 0);
      setSnackbar({ open: true, message: 'Спасибо за оценку!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Ошибка при оценке', severity: 'error' });
    }
  };

  const handleFavorite = () => {
    toggleFavorite(recipe.id, recipe);
  };

  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  return (
    <Box>
      <ImageWithFallback
        src={recipe.imageUrl}
        alt={recipe.title}
        height={400}
        sx={{ borderRadius: 2, mb: 3 }}
      />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        <Box sx={{ flex: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                {recipe.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Rating value={recipe.rating} readOnly precision={0.5} />
                <Typography variant="body2" color="text.secondary">
                  ({recipe.rating.toFixed(1)})
                </Typography>
                <Chip label={recipe.category} size="small" color="primary" variant="outlined" />
              </Box>
            </Box>

            {isAuthenticated && (
              <Stack direction="row" spacing={1}>
                <IconButton
                  onClick={handleFavorite}
                  sx={{ bgcolor: isFav ? 'error.light' : 'action.hover' }}
                >
                  {isFav ? <Favorite color="error" /> : <FavoriteBorder />}
                </IconButton>
                <Button variant="contained" color="secondary" startIcon={<AccessTime />}>
                  В план
                </Button>
              </Stack>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">{recipe.cookingTime} минут</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <People sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">{recipe.servings} порции</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main', fontSize: 12 }}
              >
                {recipe.authorName?.charAt(0) || 'A'}
              </Avatar>
              <Typography variant="body2">{recipe.authorName || 'Аноним'}</Typography>
            </Box>
          </Box>

          <Typography variant="body1" sx={{ mt: 3, lineHeight: 1.8 }}>
            {recipe.description}
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Ингредиенты
          </Typography>
          <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
            <List dense>
              {recipe.ingredients.map((ing, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{ing.ingredientName}</span>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {ing.quantity} {ing.unit}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Приготовление
          </Typography>
          <List>
            {recipe.steps.map((step, index) => (
              <ListItem key={index} sx={{ alignItems: 'flex-start', px: 0 }}>
                <Box
                  sx={{
                    minWidth: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    mr: 2,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </Box>
                <ListItemText primary={step} />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" fontWeight="bold">
              Оцените рецепт:
            </Typography>
            <Rating
              value={rating}
              onChange={(_, value) => handleRating(value)}
              size="large"
              emptyIcon={<StarBorder fontSize="inherit" />}
            />
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Комментарии ({comments.length})
          </Typography>

          {isAuthenticated ? (
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>{user?.name?.charAt(0) || 'U'}</Avatar>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Напишите комментарий..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                endIcon={<Send />}
                onClick={handleAddComment}
                disabled={loading || !newComment.trim()}
              >
                Отправить
              </Button>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Войдите, чтобы оставить комментарий
            </Typography>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : comments.length > 0 ? (
            <Stack spacing={2}>
              {comments.map((comment) => (
                <Paper key={comment.id} sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light' }}>
                      {comment.userName.charAt(0)}
                    </Avatar>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {comment.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(comment.createdAt).toLocaleDateString('ru-RU')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ pl: 4 }}>
                    {comment.text}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              Пока нет комментариев. Будьте первым!
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 250 }}>
          <Paper sx={{ p: 2, position: 'sticky', top: 80 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Похожие рецепты
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              🍽️ Скоро здесь появятся рекомендации
            </Typography>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={closeSnackbar}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
