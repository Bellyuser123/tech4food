import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/healthService.js';

export class HealthController {
  public static async getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await HealthService.getSystemHealth();
      const httpCode = health.status === 'ok' ? 200 : 200; // Return 200 with degraded info so clients can inspect status
      res.status(httpCode).json({
        success: true,
        data: health,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async ping(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: {
        pong: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
