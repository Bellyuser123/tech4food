import { Router } from 'express';
import { QrController } from '../controllers/qrController.js';
import { requireAuth, requireTenantScope, requireRole } from '../middlewares/authMiddleware.js';

export const qrRouter = Router();

// Public endpoint to resolve any table or order QR code
qrRouter.get('/resolve/:token', QrController.resolveToken);

// Protected QR management endpoints
qrRouter.get(
  '/restaurants/:restaurantId/tables',
  requireAuth,
  requireTenantScope,
  QrController.listTableQrCodes
);

qrRouter.post(
  '/restaurants/:restaurantId/tables/generate',
  requireAuth,
  requireTenantScope,
  requireRole('restaurant_manager', 'supervisor'),
  QrController.generateTableQrCode
);

qrRouter.post(
  '/restaurants/:restaurantId/revoke/:tokenId',
  requireAuth,
  requireTenantScope,
  requireRole('restaurant_manager', 'supervisor'),
  QrController.revokeQrCode
);
