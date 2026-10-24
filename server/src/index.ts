import { createApp } from './app.js';
import { env } from './config/env.js';
import { checkDatabaseHealth } from './config/database.js';

const app = createApp();

const server = app.listen(env.PORT, async () => {
  console.log(`
🛡️  ======================================================
🛡️   PlateProof 360 REST API Server
🛡️   Listening on: http://localhost:${env.PORT}
🛡️   Environment:  ${env.NODE_ENV}
🛡️   API Prefix:   ${env.API_PREFIX}
🛡️   Health Check: http://localhost:${env.PORT}${env.API_PREFIX}/health
🛡️  ======================================================
  `);

  // Check database connectivity upon startup
  const dbHealth = await checkDatabaseHealth();
  if (dbHealth.status === 'connected') {
    console.log(`✅ [Database] PostgreSQL connected (${dbHealth.latencyMs}ms)`);
  } else {
    console.warn(`⚠️ [Database] ${dbHealth.message}`);
    console.warn('ℹ️ [Database] API is operational in degraded mode. PostgreSQL will be checked dynamically.');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
