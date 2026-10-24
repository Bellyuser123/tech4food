import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';
import { requireAuth, requireTenantScope } from '../middlewares/authMiddleware.js';

export const orderRouter = Router();

// Public: Token-authorized order safety lookup
orderRouter.get('/by-token/:token', OrderController.getOrderByToken);

// Protected: Staff order lookup (anti-scraping protection)
orderRouter.get('/:orderId', requireAuth, OrderController.getOrderById);

// Protected: Restaurant orders list
orderRouter.get(
  '/restaurants/:restaurantId/list',
  requireAuth,
  requireTenantScope,
  OrderController.listRestaurantOrders
);
