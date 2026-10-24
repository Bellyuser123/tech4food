import { Router } from 'express';
import { RestaurantController } from '../controllers/restaurantController.js';
import { requireAuth, requireTenantScope, requireRole } from '../middlewares/authMiddleware.js';

export const restaurantRouter = Router();

// Onboard / Create Restaurant
restaurantRouter.post(
  '/',
  requireAuth,
  RestaurantController.createRestaurant
);

// Public restaurant profile (Separates submitted vs verified data, hides private operator details)
restaurantRouter.get('/:restaurantId/public', RestaurantController.getProfile);

// Public branch listing
restaurantRouter.get('/:restaurantId/branches', RestaurantController.getBranches);

// Full Manager Profile (Includes private operator details)
restaurantRouter.get(
  '/:restaurantId',
  requireAuth,
  requireTenantScope,
  requireRole(['restaurant_owner', 'restaurant_manager', 'platform_admin']),
  RestaurantController.getFullProfile
);

// Update Restaurant Profile (Blocks self-verification)
restaurantRouter.put(
  '/:restaurantId',
  requireAuth,
  requireTenantScope,
  requireRole(['restaurant_owner', 'restaurant_manager', 'platform_admin']),
  RestaurantController.updateRestaurant
);

restaurantRouter.patch(
  '/:restaurantId',
  requireAuth,
  requireTenantScope,
  requireRole(['restaurant_owner', 'restaurant_manager', 'platform_admin']),
  RestaurantController.updateRestaurant
);

// Branch Management
restaurantRouter.post(
  '/:restaurantId/branches',
  requireAuth,
  requireTenantScope,
  requireRole(['restaurant_owner', 'restaurant_manager', 'platform_admin']),
  RestaurantController.createBranch
);

// Platform Admin official verification
restaurantRouter.post(
  '/:restaurantId/verify',
  requireAuth,
  RestaurantController.adminVerifyRestaurant
);

// Private operational records
restaurantRouter.get(
  '/:restaurantId/private-records',
  requireAuth,
  requireTenantScope,
  RestaurantController.getPrivateRecords
);
