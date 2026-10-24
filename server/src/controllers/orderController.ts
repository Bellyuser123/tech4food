import { Request, Response } from 'express';
import { Repository } from '../db/repository.js';
import { AuthenticatedRequest, UserMembership } from '../types/auth.js';

export class OrderController {
  /**
   * Public endpoint to view order safety and transparency data via cryptographic QR token.
   * GET /api/v1/orders/by-token/:token
   *
   * SECURITY GUARANTEES:
   * 1. Only authorizes access if the token is valid, unexpired, and unrevoked.
   * 2. Returns ZERO customer personal identifiable data (names, phone numbers, emails, or payments).
   * 3. Prevents enumeration or guessing of arbitrary order IDs.
   */
  public static async getOrderByToken(req: Request, res: Response): Promise<void> {
    const rawToken = String(req.params.token || '').trim();
    if (!rawToken) {
      res.status(400).json({
        success: false,
        error: { code: 'TOKEN_REQUIRED', message: 'Token is required' },
      });
      return;
    }

    const tokenRecord = await Repository.findQrTokenByRaw(rawToken);
    if (!tokenRecord || tokenRecord.token_type !== 'order') {
      res.status(404).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'The order link or QR code is invalid or does not exist.',
        },
      });
      return;
    }

    if (tokenRecord.is_revoked) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'This order QR access link has been revoked by restaurant staff.',
        },
      });
      return;
    }

    if (tokenRecord.expires_at && new Date(tokenRecord.expires_at).getTime() < Date.now()) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'This order transparency link has expired for customer privacy.',
        },
      });
      return;
    }

    const orderData = await Repository.findOrderForCustomerToken(tokenRecord.target_reference);
    if (!orderData) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'The requested order could not be located.',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: orderData,
    });
  }

  /**
   * Protected internal endpoint for authorized restaurant staff only.
   * GET /api/v1/orders/:orderId
   *
   * SECURITY: Blocks arbitrary order scraping by requiring staff authentication
   * and verifying that the order belongs to a restaurant the user is permitted to manage.
   */
  public static async getOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orderId = String(req.params.orderId);
    const order = await Repository.findOrderById(orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
      return;
    }

    // Tenant check against authenticated user
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required to inspect private order records' },
      });
      return;
    }

    const hasAccess =
      user.isPlatformAdmin ||
      user.memberships.some((m: UserMembership) => m.restaurantId === order.restaurant_id);

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: {
          code: 'CROSS_TENANT_ACCESS_DENIED',
          message: 'You are not authorized to inspect orders for another restaurant tenant.',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  }

  /**
   * Protected endpoint: List orders for an authorized restaurant.
   * GET /api/v1/restaurants/:restaurantId/orders
   */
  public static async listRestaurantOrders(req: Request, res: Response): Promise<void> {
    const restaurantId = String(req.params.restaurantId);
    const branchId = req.query.branchId ? String(req.query.branchId) : undefined;

    const orders = await Repository.listRestaurantOrders(restaurantId, branchId);

    res.status(200).json({
      success: true,
      data: {
        restaurantId,
        orders,
      },
    });
  }
}
