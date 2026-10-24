import { Pool, PoolConfig } from 'pg';
import { env } from './env.js';

const poolConfig: PoolConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
      ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
      max: env.DB_POOL_MAX,
    }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
      max: env.DB_POOL_MAX,
      connectionTimeoutMillis: 3000,
    };

export const pool = new Pool(poolConfig);

// Suppress unhandled pool errors so server remains resilient
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

export interface DatabaseHealth {
  status: 'connected' | 'disconnected';
  latencyMs?: number;
  message?: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const start = performance.now();
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      const latencyMs = Math.round(performance.now() - start);
      return {
        status: 'connected',
        latencyMs,
        message: 'PostgreSQL database pool is active and responsive',
      };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      status: 'disconnected',
      latencyMs: Math.round(performance.now() - start),
      message: `Database unreachable: ${errorMessage}`,
    };
  }
}

export async function query<T = unknown>(text: string, params?: unknown[]) {
  const start = performance.now();
  const res = await pool.query(text, params);
  const duration = Math.round(performance.now() - start);
  if (env.NODE_ENV === 'development') {
    console.debug(`[DB Query] executed in ${duration}ms: ${text.slice(0, 100)}`);
  }
  return res as { rows: T[]; rowCount: number };
}
