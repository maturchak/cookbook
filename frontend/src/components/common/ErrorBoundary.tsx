import React from 'react';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Ловит ошибки рендера (в том числе падение при загрузке lazy-чанка)
 * и показывает понятный экран вместо белого листа.
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleHome = (): void => {
    this.setState({ error: null });
    window.location.href = '/';
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ErrorOutline color="error" sx={{ fontSize: 56, mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Что-то пошло не так
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error.message || 'Непредвиденная ошибка приложения'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<Refresh />} onClick={this.handleReload}>
              Обновить страницу
            </Button>
            <Button variant="outlined" onClick={this.handleHome}>
              На главную
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }
}
