import { Router } from 'express';
import { healthRouter } from './healthRoutes.js';
import { authRouter } from './authRoutes.js';
import { restaurantRouter } from './restaurantRoutes.js';
import { incidentRouter } from './incidentRoutes.js';
import { menuRouter } from './menuRoutes.js';
import { uploadRouter } from './uploadRoutes.js';

export const apiRouter = Router();

// 1. Health and System Diagnostics
apiRouter.use(healthRouter);

// 2. Authentication and User Access
apiRouter.use('/auth', authRouter);

// 3. Multi-Tenant Restaurant Profiles & Branches
apiRouter.use('/restaurants', restaurantRouter);

// 4. Menu Management & Structured Allergens
apiRouter.use('/restaurants', menuRouter);

// 5. File & Image Uploads
apiRouter.use('/uploads', uploadRouter);

// 6. Incident Management & Corrective Actions
apiRouter.use('/operations', incidentRouter);

// API Documentation index
apiRouter.get('/', (_req, res) => {
  res.json({
    service: 'PlateProof 360 REST API',
    version: '1.0.0',
    documentation: '/api/v1/health',
    endpoints: {
      health: '/api/v1/health',
      ping: '/api/v1/ping',
      auth: {
        login: 'POST /api/v1/auth/login',
        register: 'POST /api/v1/auth/register',
        me: 'GET /api/v1/auth/me',
      },
      restaurants: {
        create: 'POST /api/v1/restaurants',
        publicProfile: 'GET /api/v1/restaurants/:restaurantId/public',
        fullProfile: 'GET /api/v1/restaurants/:restaurantId',
        update: 'PUT /api/v1/restaurants/:restaurantId',
        verify: 'POST /api/v1/restaurants/:restaurantId/verify',
        branches: 'GET /api/v1/restaurants/:restaurantId/branches',
        createBranch: 'POST /api/v1/restaurants/:restaurantId/branches',
      },
      menus: {
        publicMenu: 'GET /api/v1/restaurants/:restaurantId/menus',
        createCategory: 'POST /api/v1/restaurants/:restaurantId/menus/categories',
        updateCategory: 'PUT /api/v1/restaurants/:restaurantId/menus/categories/:categoryId',
        createItem: 'POST /api/v1/restaurants/:restaurantId/menus/items',
        updateItem: 'PUT /api/v1/restaurants/:restaurantId/menus/items/:itemId',
        toggleAvailability: 'PATCH /api/v1/restaurants/:restaurantId/menus/items/:itemId/availability',
        deleteItem: 'DELETE /api/v1/restaurants/:restaurantId/menus/items/:itemId',
        reorder: 'POST /api/v1/restaurants/:restaurantId/menus/reorder',
      },
      uploads: {
        uploadImage: 'POST /api/v1/uploads',
      },
      operations: {
        createIncident: 'POST /api/v1/operations/:restaurantId/incidents',
        performAction: 'POST /api/v1/operations/actions/:actionId/perform',
        verifyAction: 'POST /api/v1/operations/actions/:actionId/verify',
      },
    },
  });
});
