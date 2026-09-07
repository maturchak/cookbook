import type { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { badRequest } from '../errors';

export const uploadController = {
  uploadImage: [
    requireAuth,
    upload.single('image'),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.file) throw badRequest('Файл не получен');
      res.status(201).json({ url: `/api/uploads/${req.file.filename}` });
    }),
  ] as RequestHandler[],
};
