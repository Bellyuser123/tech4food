import { Request, Response } from 'express';
import { z } from 'zod';
import { Repository } from '../db/repository.js';
import { QrService } from '../services/qrService.js';
import { env } from '../config/env.js';

const generateTableQrSchema = z.object({
  tableNumber: z.string().min(1, 'Table number or identifier is required').max(50),
  branchId: z.string().uuid().optional(),
});

export class QrController {
  /**
   * Public endpoint to resolve any table or order QR code.
   * GET /api/v1/qr/resolve/:token
   */
  public static async resolveToken(req: Request, res: Response): Promise<void> {
    const rawToken = String(req.params.token || '').trim();
    if (!rawToken) {
      res.status(400).json({
        success: false,
        error: { code: 'TOKEN_REQUIRED', message: 'QR token is required' },
      });
      return;
    }

    const tokenRecord = await Repository.findQrTokenByRaw(rawToken);
    if (!tokenRecord) {
      res.status(404).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'The scanned QR code is invalid or does not exist.',
        },
      });
      return;
    }

    // Check revocation
    if (tokenRecord.is_revoked) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'This QR code has been revoked or replaced by restaurant staff.',
        },
      });
      return;
    }

    // Check expiration
    if (tokenRecord.expires_at) {
      const expiry = new Date(tokenRecord.expires_at);
      if (expiry.getTime() < Date.now()) {
        res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'This QR access token has expired for customer privacy and safety.',
          },
        });
        return;
      }
    }

    // Handle Table QR code
    if (tokenRecord.token_type === 'table') {
      const restaurant = await Repository.findRestaurantById(tokenRecord.restaurant_id);
      const branch = await Repository.findBranchById(tokenRecord.branch_id);

      res.status(200).json({
        success: true,
        data: {
          type: 'table',
          restaurantId: tokenRecord.restaurant_id,
          branchId: tokenRecord.branch_id,
          tableNumber: tokenRecord.target_reference,
          restaurant: restaurant
            ? {
                id: restaurant.id,
                name: restaurant.name,
                slug: restaurant.slug,
                description: restaurant.description,
                address: restaurant.address,
                phone: restaurant.phone,
                is_verified: restaurant.is_verified,
                verification_source: restaurant.verification_source,
              }
            : null,
          branch: branch
            ? {
                id: branch.id,
                name: branch.name,
                code: branch.code,
                address: branch.address,
                phone: branch.phone,
              }
            : null,
          redirectPath: `/restaurants/${tokenRecord.restaurant_id}/menu?table=${encodeURIComponent(
            tokenRecord.target_reference
          )}`,
        },
      });
      return;
    }

    // Handle Order QR code
    if (tokenRecord.token_type === 'order') {
      const orderData = await Repository.findOrderForCustomerToken(tokenRecord.target_reference);
      if (!orderData) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'The order associated with this QR code could not be found.',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          type: 'order',
          order: orderData,
        },
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: { code: 'UNKNOWN_TOKEN_TYPE', message: 'Unrecognized QR token type' },
    });
  }

  /**
   * Protected endpoint: List table QR codes for restaurant manager.
   * GET /api/v1/restaurants/:restaurantId/qr/tables
   */
  public static async listTableQrCodes(req: Request, res: Response): Promise<void> {
    const restaurantId = String(req.params.restaurantId);
    const tokens = await Repository.listTableQrTokens(restaurantId);

    const baseUrl = process.env.PUBLIC_FRONTEND_URL || `http://localhost:${env.PORT || 4000}`;

    // Hydrate each token with deep link and quick QR data URL preview
    const hydrated = await Promise.all(
      tokens.map(async (t) => {
        const rawToken = t.raw_token_for_demo || t.id;
        const qrAssets = await QrService.generateQrCode(baseUrl, rawToken, 'table');
        return {
          id: t.id,
          restaurantId: t.restaurant_id,
          branchId: t.branch_id,
          tableNumber: t.target_reference,
          tokenHash: t.token_hash,
          rawTokenPreview: rawToken,
          isRevoked: t.is_revoked,
          createdAt: t.created_at,
          deepLinkUrl: qrAssets.deepLinkUrl,
          qrDataUrl: qrAssets.qrDataUrl,
          qrSvg: qrAssets.qrSvg,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        restaurantId,
        tableQrs: hydrated,
      },
    });
  }

  /**
   * Protected endpoint: Generate a new table QR code.
   * POST /api/v1/restaurants/:restaurantId/qr/tables/generate
   */
  public static async generateTableQrCode(req: Request, res: Response): Promise<void> {
    const restaurantId = String(req.params.restaurantId);
    const parse = generateTableQrSchema.safeParse(req.body);

    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid table QR parameters',
          details: parse.error.flatten(),
        },
      });
      return;
    }

    const { tableNumber, branchId } = parse.data;

    // Resolve branch
    const branches = await Repository.findBranchesByRestaurantId(restaurantId);
    const targetBranchId = branchId || branches[0]?.id || 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    const rawToken = QrService.generateOpaqueToken();
    const tokenRecord = await Repository.createTableQrToken(
      restaurantId,
      targetBranchId,
      tableNumber,
      rawToken
    );

    const baseUrl = process.env.PUBLIC_FRONTEND_URL || `http://localhost:${env.PORT || 4000}`;
    const qrAssets = await QrService.generateQrCode(baseUrl, rawToken, 'table');

    res.status(201).json({
      success: true,
      data: {
        id: tokenRecord.id,
        restaurantId,
        branchId: targetBranchId,
        tableNumber,
        rawToken,
        tokenHash: tokenRecord.token_hash,
        isRevoked: tokenRecord.is_revoked,
        createdAt: tokenRecord.created_at,
        deepLinkUrl: qrAssets.deepLinkUrl,
        qrDataUrl: qrAssets.qrDataUrl,
        qrSvg: qrAssets.qrSvg,
        printableStationCardHtml: `
          <div style="text-align: center; font-family: sans-serif; padding: 24px; border: 2px solid #7F1D1D; border-radius: 16px; max-width: 320px;">
            <h2 style="color: #7F1D1D; margin: 0 0 4px 0;">PlateProof 360</h2>
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #78716C; margin: 0 0 16px 0;">Verified Food Safety & Accountability</p>
            <img src="${qrAssets.qrDataUrl}" alt="Table QR" style="width: 220px; height: 220px; margin: 0 auto; display: block;" />
            <h3 style="margin: 16px 0 4px 0; font-size: 20px;">${tableNumber}</h3>
            <p style="font-size: 12px; color: #44403C; margin: 0;">Scan with camera to browse verified menu, ingredients & temperature logs</p>
          </div>
        `,
      },
    });
  }

  /**
   * Protected endpoint: Revoke a QR code.
   * POST /api/v1/restaurants/:restaurantId/qr/revoke/:tokenId
   */
  public static async revokeQrCode(req: Request, res: Response): Promise<void> {
    const restaurantId = String(req.params.restaurantId);
    const tokenId = String(req.params.tokenId);

    const revoked = await Repository.revokeQrToken(tokenId, restaurantId);
    if (!revoked) {
      res.status(404).json({
        success: false,
        error: {
          code: 'TOKEN_NOT_FOUND',
          message: 'QR token not found or does not belong to this restaurant',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        tokenId,
        restaurantId,
        isRevoked: true,
        revokedAt: new Date().toISOString(),
      },
    });
  }
}
