import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { StorageService } from '../services/storageService.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadRouter = Router();

// POST /api/v1/uploads - Handles multipart file or base64 data upload
uploadRouter.post(
  '/',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.file) {
        const metadata = await StorageService.saveFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        res.status(201).json({
          success: true,
          data: metadata,
        });
        return;
      }

      if (req.body?.base64Image) {
        const metadata = await StorageService.saveBase64(
          req.body.base64Image,
          req.body.fileName || 'uploaded_image.png'
        );
        res.status(201).json({
          success: true,
          data: metadata,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE_PROVIDED',
          message: 'Please provide either a multipart form file or a base64Image string.',
        },
      });
    } catch (err: unknown) {
      next(err);
    }
  }
);
