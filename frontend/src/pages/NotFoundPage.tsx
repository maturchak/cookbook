import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import { Home } from '@mui/icons-material';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Страница не найдена');

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
      <Box sx={{ fontSize: '4rem', lineHeight: 1, mb: 2 }}>🍽️</Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        404 — страница не найдена
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Похоже, этот рецепт кто-то уже съел.
      </Typography>
      <Button
        component={Link}
        to="/"
        variant="contained"
        startIcon={<Home />}
      >
        Вернуться на главную
      </Button>
    </Container>
  );
}
