import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import Layout from './components/common/Layout';

// Ленивая загрузка страниц: каждая страница — отдельный чанк,
// пользователь не качает весь код приложения сразу.
const HomePage = lazy(() => import('./pages/HomePage'));
const RecipesPage = lazy(() => import('./pages/RecipesPage'));
const RecipePage = lazy(() => import('./pages/RecipePage'));
const CreateRecipePage = lazy(() => import('./pages/CreateRecipePage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const PlanPage = lazy(() => import('./pages/PlanPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CssBaseline />
        <AuthProvider>
          <FavoritesProvider>
            <BrowserRouter>
              <Suspense fallback={<LoadingSpinner text="Загрузка страницы..." />}>
                <Routes>
                  {/* Публичные маршруты */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Защищённые маршруты */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/recipes" element={<RecipesPage />} />
                      {/* ВАЖНО: /recipe/new объявлен раньше /recipe/:id */}
                      <Route path="/recipe/new" element={<CreateRecipePage />} />
                      <Route path="/recipe/:id" element={<RecipePage />} />
                      <Route path="/favorites" element={<FavoritesPage />} />
                      <Route path="/plan" element={<PlanPage />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </FavoritesProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
