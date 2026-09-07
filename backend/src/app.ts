import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { CONFIG } from './config';
import { errorHandler, notFoundHandler } from './middleware/error';
import { authController } from './controllers/authController';
import { recipeController } from './controllers/recipeController';
import { userController } from './controllers/userController';
import { planController } from './controllers/planController';
import { uploadController } from './controllers/uploadController';

export function createApp() {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '2mb' }));

  // загруженные картинки отдаём через /api/uploads, чтобы фронтенд-прокси их видел
  app.use('/api/uploads', express.static(path.join(CONFIG.uploadDir)));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/auth/register', authController.register);
  app.post('/api/auth/login', authController.login);
  app.get('/api/auth/me', ...authController.me);

  app.get('/api/recipes', recipeController.list);
  app.get('/api/recipes/:id', recipeController.get);
  app.post('/api/recipes', ...recipeController.create);
  app.put('/api/recipes/:id', ...recipeController.update);
  app.delete('/api/recipes/:id', ...recipeController.remove);
  app.post('/api/recipes/:id/rate', ...recipeController.rate);
  app.get('/api/recipes/:id/comments', recipeController.listComments);
  app.post('/api/recipes/:id/comments', ...recipeController.addComment);

  app.get('/api/categories', recipeController.listCategories);
  app.get('/api/ingredients', recipeController.listIngredients);

  app.get('/api/favorites', ...userController.listFavorites);
  app.post('/api/favorites/:recipeId', ...userController.addFavorite);
  app.delete('/api/favorites/:recipeId', ...userController.removeFavorite);

  app.get('/api/plan', ...planController.list);
  app.put('/api/plan', ...planController.replace);

  app.post('/api/upload', ...uploadController.uploadImage);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
