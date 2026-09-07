import { api } from './api';
import { USE_MOCK } from './useMock';
import { AuthResponse, User } from '../types';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Режим данных берётся из VITE_USE_MOCK (см. useMock.ts)

const DEMO_USER: User = {
  id: '1',
  email: 'demo@cookbook.com',
  name: 'Демо Пользователь',
};

const DEMO_PASSWORD = 'demo123';

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

function makeToken(email: string): string {
  // Мок-токен для разработки. Реальный JWT выдаст бэкенд.
  const payload = btoa(JSON.stringify({ email, iat: Date.now() }));
  return `mock.${payload}.signature`;
}

function normalizeError(err: unknown, fallback: string): Error {
  const message =
    (err as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback;
  return new Error(message);
}

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    if (USE_MOCK) {
      await delay();
      if (
        data.email.trim().toLowerCase() !== DEMO_USER.email ||
        data.password !== DEMO_PASSWORD
      ) {
        throw new Error('Неверный email или пароль');
      }
      return { user: DEMO_USER, token: makeToken(DEMO_USER.email) };
    }
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    if (USE_MOCK) {
      await delay();
      if (data.password.length < 6) {
        throw new Error('Пароль должен содержать минимум 6 символов');
      }
      const user: User = {
        id: String(Date.now()),
        email: data.email.trim().toLowerCase(),
        name: data.name.trim(),
      };
      return { user, token: makeToken(user.email) };
    }
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async (): Promise<User> => {
    if (USE_MOCK) {
      await delay(200);
      const saved = localStorage.getItem('user');
      if (!saved) throw new Error('Не авторизован');
      return JSON.parse(saved) as User;
    }
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

export { normalizeError };
