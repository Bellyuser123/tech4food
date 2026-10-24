import { Router } from 'express';
import { HealthController } from '../controllers/healthController.js';

export const healthRouter = Router();

// GET /api/v1/health - System and database status
healthRouter.get('/health', HealthController.getHealth);

// GET /api/v1/ping - Instant connectivity verification
healthRouter.get('/ping', HealthController.ping);
