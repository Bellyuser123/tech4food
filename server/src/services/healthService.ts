import { checkDatabaseHealth } from '../config/database.js';
import { env } from '../config/env.js';
import { HealthResponse } from '../validation/healthValidation.js';

const startTime = Date.now();

export class HealthService {
  public static async getSystemHealth(): Promise<HealthResponse> {
    const dbHealth = await checkDatabaseHealth();
    const uptimeSeconds = Math.round((Date.now() - startTime) / 1000);

    // API is healthy even if DB is disconnected, but marked degraded
    const systemStatus: 'ok' | 'degraded' | 'error' =
      dbHealth.status === 'connected' ? 'ok' : 'degraded';

    return {
      status: systemStatus,
      service: 'PlateProof 360 REST API',
      version: '1.0.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      database: dbHealth,
    };
  }
}
