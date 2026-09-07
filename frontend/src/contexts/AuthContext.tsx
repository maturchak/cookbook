import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { USE_MOCK } from '../services/useMock';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getErrorText(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error
    || (err instanceof Error ? err.message : fallback)
    || fallback;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    if (!saved) return null;
    try {
      return JSON.parse(saved) as User;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (err: unknown) {
      const message = getErrorText(err, 'Ошибка входа');
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register({ name, email, password });
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (err: unknown) {
      const message = getErrorText(err, 'Ошибка регистрации');
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    authService.logout();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Реальный режим: при старте проверяем, что сохранённый токен ещё жив
  useEffect(() => {
    if (USE_MOCK || !token) return;
    setIsLoading(true);
    authService
      .getCurrentUser()
      .then((user) => setUser(user))
      .catch(() => {
        /* 401 уже обработан интерсептором в api.ts */
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
      isAuthenticated: !!user && !!token,
    }),
    [user, token, isLoading, error, login, register, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
