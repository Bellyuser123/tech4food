import { Router } from 'express';
import { IncidentController } from '../controllers/incidentController.js';
import { requireAuth, requireTenantScope, requireRole } from '../middlewares/authMiddleware.js';

export const incidentRouter = Router();

// Create incident with audit transaction (kitchen staff, supervisor, manager)
incidentRouter.post(
  '/:restaurantId/incidents',
  requireAuth,
  requireTenantScope,
  requireRole(['kitchen_staff', 'hygiene_staff', 'supervisor', 'restaurant_manager', 'restaurant_owner']),
  IncidentController.createIncident
);

// Staff performs corrective action
incidentRouter.post(
  '/actions/:actionId/perform',
  requireAuth,
  requireRole(['kitchen_staff', 'hygiene_staff', 'supervisor', 'restaurant_manager']),
  IncidentController.performCorrectiveAction
);

// Supervisor verifies corrective action (Enforces DUAL-CONTROL: supervisor !== performer)
incidentRouter.post(
  '/actions/:actionId/verify',
  requireAuth,
  requireRole(['supervisor', 'restaurant_manager']),
  IncidentController.verifyCorrectiveAction
);
