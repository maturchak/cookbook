import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  port: Number(process.env.PORT || 8000),
  jwtSecret: process.env.JWT_SECRET || 'cookbook-dev-secret',
  jwtExpiresIn: '7d',
  // fileURLToPath корректно работает и на Windows (pathname дал бы /C:/... и удвоил диск)
  uploadDir: fileURLToPath(new URL('../public/uploads', import.meta.url)),
} as const;
