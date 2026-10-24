import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'error']),
  service: z.string(),
  version: z.string(),
  environment: z.string(),
  timestamp: z.string(),
  uptimeSeconds: z.number(),
  database: z.object({
    status: z.enum(['connected', 'disconnected']),
    latencyMs: z.number().optional(),
    message: z.string().optional(),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
