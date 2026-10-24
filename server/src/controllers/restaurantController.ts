import { Response, NextFunction } from 'express';
import { Repository, RestaurantRecord } from '../db/repository.js';
import { AuthenticatedRequest } from '../types/auth.js';

export class RestaurantController {
  /**
   * Public Restaurant Profile
   * Strips private ownership contact data.
   * Clearly distinguishes restaurant-submitted information from platform-verified certifications.
   */
  public static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

      const branches = await Repository.findBranchesByRestaurantId(restaurantId);

      // Separate submitted vs verified data per specification
      res.status(200).json({
        success: true,
        data: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          logoUrl: restaurant.logo_url,
          bannerUrl: restaurant.banner_url,
          description: restaurant.description,
          address: restaurant.address,
          phone: restaurant.phone,
          openingHours: restaurant.opening_hours,
          branches,
          verification: {
            isVerified: restaurant.is_verified,
            verifiedAt: restaurant.verified_at || null,
            verificationSource: restaurant.verification_source || (restaurant.is_verified ? 'Platform Audit Team' : null),
            officialRegistrationId: restaurant.official_license_number || 'Pending Review',
            isOfficialAuthorityVerified: restaurant.is_verified,
            disclaimer:
              'Notice: Operational checklist records and temperature logs are self-reported by the kitchen team. Only verified status flags have been authenticated through the PlateProof verification workflow.',
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Full Manager / Operator Profile View
   * Includes private operator metadata.
   */
  public static async getFullProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const restaurantId = req.activeRestaurantId!;
      const restaurant = await Repository.findRestaurantById(restaurantId);
      const branches = await Repository.findBranchesByRestaurantId(restaurantId);

      res.status(200).json({
        success: true,
        data: {
          ...restaurant,
          branches,
          operatorPrivateInfo: {
            ownerFullName: restaurant?.owner_full_name,
            ownerEmail: restaurant?.owner_contact_email,
            taxId: restaurant?.tax_identifier,
            confidentiality: 'Restricted: Visible only to authorized managers and platform auditors.',
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Onboard New Restaurant
   */
  public static async createRestaurant(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, slug, description, address, phone, openingHours, logoUrl, bannerUrl, officialLicense } = req.body;

      if (!name || !address) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Restaurant name and address are required.' },
        });
        return;
      }

      const generatedId = `rest-${Date.now()}`;
      const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const newRestaurant: RestaurantRecord = {
        id: generatedId,
        name,
        slug: generatedSlug,
        description: description || '',
        address,
        phone: phone || '',
        opening_hours: openingHours,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        official_license_number: officialLicense,
        is_verified: false, // Must be verified by platform admin!
        owner_full_name: req.user?.fullName,
        owner_contact_email: req.user?.email,
      };

      // Add to repository
      await Repository.updateRestaurant(generatedId, newRestaurant);

      // Auto-assign owner membership to creator
      req.user?.memberships.push({
        restaurantId: generatedId,
        branchId: null,
        role: 'restaurant_owner',
      });

      res.status(201).json({
        success: true,
        data: newRestaurant,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update Restaurant Profile
   * Anti-self-verification rule enforced.
   */
  public static async updateRestaurant(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const restaurantId = req.activeRestaurantId!;
      const body = req.body || {};

      // ANTI-SELF-VERIFICATION ENFORCEMENT:
      if ('is_verified' in body || 'isVerified' in body) {
        if (!req.user?.isPlatformAdmin) {
          res.status(403).json({
            success: false,
            error: {
              code: 'SELF_VERIFICATION_PROHIBITED',
              message:
                'Privilege Violation: A restaurant account cannot mark itself officially verified. Official certification is strictly reserved for Platform Administrators.',
            },
          });
          return;
        }
      }

      const updated = await Repository.updateRestaurant(restaurantId, {
        name: body.name,
        description: body.description,
        address: body.address,
        phone: body.phone,
        opening_hours: body.openingHours || body.opening_hours,
        logo_url: body.logoUrl || body.logo_url,
        banner_url: body.bannerUrl || body.banner_url,
        official_license_number: body.officialLicenseNumber || body.official_license_number,
        is_verified: req.user?.isPlatformAdmin ? body.is_verified : undefined,
      });

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Branch Management
   */
  public static async getBranches(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const restaurantId = String(req.params.restaurantId);
      const branches = await Repository.findBranchesByRestaurantId(restaurantId);
      res.status(200).json({
        success: true,
        data: branches,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createBranch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const restaurantId = req.activeRestaurantId!;
      const { name, code, address, phone } = req.body;

      if (!name || !code || !address) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Branch name, code, and address are required.' },
        });
        return;
      }

      const branch = await Repository.createBranch(restaurantId, {
        name,
        code,
        address,
        phone: phone || '',
      });

      res.status(201).json({
        success: true,
        data: branch,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async adminVerifyRestaurant(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const restaurantId = String(req.params.restaurantId);
      if (!req.user?.isPlatformAdmin) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only a Platform Administrator can officially verify a restaurant.',
          },
        });
        return;
      }

      const updated = await Repository.updateRestaurant(restaurantId, {
        is_verified: true,
        verified_by: req.user.id,
        verified_at: new Date().toISOString(),
        verification_source: 'Official Platform Audit Inspection',
      });

      res.status(200).json({
        success: true,
        data: {
          message: `Restaurant ${restaurantId} has been officially verified by Platform Administrator.`,
          restaurant: updated,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getPrivateRecords(req: AuthenticatedRequest, res: Response): Promise<void> {
    const restaurantId = req.activeRestaurantId!;
    const restaurant = await Repository.findRestaurantById(restaurantId);

    res.status(200).json({
      success: true,
      data: {
        restaurant,
        accessContext: {
          restaurantId,
          role: req.activeRole,
          accessedBy: req.user?.email,
          scopeEnforced: true,
        },
        privateNotice: 'Confidential operational records scoped strictly to authorized tenant.',
      },
    });
  }
}
