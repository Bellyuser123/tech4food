import { Response, NextFunction } from 'express';
import { Repository } from '../db/repository.js';
import { AuthenticatedRequest } from '../types/auth.js';

export class MenuController {
  public static async getPublicMenu(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const restaurantId = String(req.params.restaurantId);
      const restaurant = await Repository.findRestaurantById(restaurantId);

      if (!restaurant) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Restaurant not found' },
        });
        return;
      }

      const categories = await Repository.findCategoriesByRestaurantId(restaurantId);
      const items = await Repository.findMenuItemsByRestaurantId(restaurantId, false);

      res.status(200).json({
        success: true,
        data: {
          restaurant: {
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            address: restaurant.address,
            phone: restaurant.phone,
            is_verified: restaurant.is_verified,
            verification_source: restaurant.verification_source,
            verified_at: restaurant.verified_at,
          },
          allergyCautionNotice:
            'Notice: While our recipes are documented under strict food-safety protocols, cross-contact can occur in shared kitchen environments. Please confirm critical or severe anaphylactic allergies directly with floor supervisors before consumption.',
          categories,
          items,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createCategory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const restaurantId = req.activeRestaurantId!;
      const { name, displayOrder } = req.body;

      if (!name || typeof name !== 'string') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Category name is required.' },
        });
        return;
      }

      const category = await Repository.createCategory(
        restaurantId,
        name.trim(),
        Number(displayOrder) || 0
      );

      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateCategory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const restaurantId = req.activeRestaurantId!;
      const categoryId = String(req.params.categoryId);
      const { name, displayOrder, is_active } = req.body;

      const updated = await Repository.updateCategory(restaurantId, categoryId, {
        name,
        display_order: displayOrder !== undefined ? Number(displayOrder) : undefined,
        is_active,
      });

      if (!updated) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Menu category not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteCategory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const restaurantId = req.activeRestaurantId!;
      const categoryId = String(req.params.categoryId);

      const success = await Repository.deleteCategory(restaurantId, categoryId);
      if (!success) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Category not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: 'Category deactivated successfully' },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createMenuItem(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const restaurantId = req.activeRestaurantId!;
      const {
        categoryId,
        name,
        description,
        price,
        imageUrl,
        dietaryTags,
        isAvailable,
        displayOrder,
        prepTemperature,
        ingredients,
        allergens,
      } = req.body;

      if (!name || price === undefined || !categoryId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Menu item requires name, categoryId, and price.',
          },
        });
        return;
      }

      const item = await Repository.createMenuItem(restaurantId, {
        category_id: categoryId,
        name: name.trim(),
        description: description || '',
        price: Number(price),
        image_url: imageUrl,
        dietary_tags: Array.isArray(dietaryTags) ? dietaryTags : [],
        is_available: isAvailable !== undefined ? Boolean(isAvailable) : true,
        display_order: Number(displayOrder) || 0,
        prep_temperature: prepTemperature,
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        allergens: Array.isArray(allergens) ? allergens : [],
      });

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateMenuItem(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const restaurantId = req.activeRestaurantId!;
      const itemId = String(req.params.itemId);

      const item = await Repository.updateMenuItem(restaurantId, itemId, req.body);
      if (!item) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Menu item not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async toggleAvailability(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const restaurantId = req.activeRestaurantId!;
      const itemId = String(req.params.itemId);
      const isAvailable = Boolean(req.body.is_available);

      const updated = await Repository.toggleMenuItemAvailability(
        restaurantId,
        itemId,
        isAvailable
      );

      if (!updated) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Menu item not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteMenuItem(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const restaurantId = req.activeRestaurantId!;
      const itemId = String(req.params.itemId);

      const deleted = await Repository.deleteMenuItem(restaurantId, itemId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Menu item not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: 'Menu item removed successfully' },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async reorder(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const restaurantId = req.activeRestaurantId!;
      const { itemIds } = req.body;

      if (!Array.isArray(itemIds)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'itemIds array is required.' },
        });
        return;
      }

      await Repository.reorderMenuItems(restaurantId, itemIds);

      res.status(200).json({
        success: true,
        data: { message: 'Menu items reordered successfully' },
      });
    } catch (err) {
      next(err);
    }
  }
}
