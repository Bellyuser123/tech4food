import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, checkDatabaseHealth, DatabaseHealth } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<{ success: boolean; message: string }> {
  try {
    const health = await checkDatabaseHealth();
    if (health.status !== 'connected') {
      return {
        success: false,
        message: `Database is not reachable (${health.message}). Skipping migrations.`,
      };
    }

    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      return { success: true, message: 'No migrations directory found.' };
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        await client.query(sql);
      }
      await client.query('COMMIT');
      return { success: true, message: `Successfully executed ${files.length} migration(s).` };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Migration failed: ${message}` };
  }
}

export { pool, checkDatabaseHealth, type DatabaseHealth };
