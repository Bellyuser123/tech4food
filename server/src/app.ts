import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiRouter } from './routes/apiRouter.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { enforceTenantScope } from './middlewares/tenantScope.js';

import path from 'path';
import { StorageService } from './services/storageService.js';

export function createApp(): Express {
  const app = express();

  // Security headers & CORS
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
    })
  );

  // Serve static uploaded files
  app.use('/uploads', express.static(StorageService.getUploadDir()));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);

  // Tenant scoping enforcement
  app.use(enforceTenantScope);

  // API Router mounted at configured API_PREFIX (default: /api/v1)
  app.use(env.API_PREFIX, apiRouter);

  // Root landing check
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      service: 'PlateProof 360 API',
      status: 'online',
      healthCheck: `${env.API_PREFIX}/health`,
    });
  });

  // 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found on this server.',
      },
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
