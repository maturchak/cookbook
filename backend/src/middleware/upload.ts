import fs from 'node:fs';
import multer from 'multer';
import { CONFIG } from '../config';
import { badRequest } from '../errors';

fs.mkdirSync(CONFIG.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CONFIG.uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]+/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

/** Middleware загрузки файлов: только картинки, до 5 МБ. */
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(badRequest('Можно загружать только изображения'));
      return;
    }
    cb(null, true);
  },
});
