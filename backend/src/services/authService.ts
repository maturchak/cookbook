import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config';
import { conflict, unauthorized } from '../errors';
import { userRepository } from '../repositories/userRepository';
import type { User } from '@prisma/client';

export const userDto = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatar: user.avatar ?? undefined,
});

const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, CONFIG.jwtSecret, { expiresIn: CONFIG.jwtExpiresIn });

export const authService = {
  async register(name: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim()) throw conflict('Укажите имя');
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw conflict('Некорректный email');
    if (password.length < 6) throw conflict('Пароль должен содержать минимум 6 символов');

    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) throw conflict('Пользователь с таким email уже зарегистрирован');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.create({
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
    });

    return { user: userDto(user), token: signToken(user.id) };
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email.trim().toLowerCase());
    if (!user) throw unauthorized('Неверный email или пароль');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw unauthorized('Неверный email или пароль');

    return { user: userDto(user), token: signToken(user.id) };
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw unauthorized();
    return userDto(user);
  },
};
