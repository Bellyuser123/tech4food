import { Router } from 'express';
import { MenuController } from '../controllers/menuController.js';
import { requireAuth, requireTenantScope, requireRole } from '../middlewares/authMiddleware.js';

export const menuRouter = Router();

// Public menu browsing (No authentication required, mobile-friendly)
menuRouter.get('/:restaurantId/menus', MenuController.getPublicMenu);

// Category Management (Owner, Manager, Admin)
menuRouter.post(
  '/:restaurantId/menus/categories',
  requireAuth,
  requireTenantScope,
  requireRole(['restaurant_owner', 'restaurant_manager', 'platform_admin']),
  MenuController.createCategory
);

menuRouter.put(
  '/:restaurantId/menus/categories/:categoryId',
  requireAuth,
  requireTenantScope,
  requireRole(['restaurant_owner', 'restaurant_manager', 'platform_admin']),
  MenuController.updateCategory
);

menuRouter.delete(
  '/:restaurantId/menus/categories/:categoryId',
  requireAuth,
  requireTenantScope,
  requireRole(['restaurant_owner', 'restaurant_manager', 'platform_admin']),
  MenuController.deleteCategory
);

// Menu Item CRUD & Structured Allergens
menuRouter.post(
  '/:restaurantId/menus/items',
  requireAuth,
  requireTenantScope,
  requireRole(['restaurant_owner', 'restaurant_manager', 'platform_admin']),
  MenuController.createMenuItem
);

menuRouter.put(
  '/:restaurantId/menus/items/:itemId',
  requireAuth,
  requireTenantScope,
  requireRole(['restaurant_owner', 'restaurant_manager', 'platform_admin']),
  MenuController.updateMenuItem
);

menuRouter.patch(
  '/:restaurantId/menus/items/:itemId/availability',
  requireAuth,
  requireTenantScope,
  requireRole(['restaurant_owner', 'restaurant_manager', 'supervisor', 'platform_admin']),
  MenuController.toggleAvailability
);

menuRouter.delete(
  '/:restaurantId/menus/items/:itemId',
  requireAuth,
  requireTenantScope,
  requireRole(['restaurant_owner', 'restaurant_manager', 'platform_admin']),
  MenuController.deleteMenuItem
);

menuRouter.post(
  '/:restaurantId/menus/reorder',
  requireAuth,
  requireTenantScope,
  requireRole(['restaurant_owner', 'restaurant_manager', 'platform_admin']),
  MenuController.reorder
);
