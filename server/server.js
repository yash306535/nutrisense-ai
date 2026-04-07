// Cloud Run injects secrets as env vars via --set-secrets flag.
// dotenv is only used for local development.
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// ── Validate required env vars before anything else ───────────────────────
const REQUIRED_ENV = [
  'MONGODB_URI',
  // 'REDIS_URL', // optional — Redis disabled for now
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'NVIDIA_API_KEY',
];

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { getRedisClient } = require('./src/services/cacheService');
const logger = require('./src/utils/logger');

// Import and start cron jobs
require('./src/jobs/weeklyReport.job');

// Cloud Run sets PORT env var (default 8080). Local dev defaults to 5000.
const PORT = parseInt(process.env.PORT, 10) || 5000;
const server = http.createServer(app);
// Cloud Run requires the server to listen on 0.0.0.0
const HOST = '0.0.0.0';

async function startServer() {
  await connectDB();

  // Initialize Redis (optional — skipped if REDIS_URL not set)
  if (process.env.REDIS_URL) getRedisClient();

  server.listen(PORT, HOST, () => {
    logger.info(`NutriSense server running`, {
      env: process.env.NODE_ENV,
      host: HOST,
      port: PORT,
    });
  });
}

startServer().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});

// ── Graceful Shutdown ──────────────────────────────────────────────────────
async function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');

      const { getRedisClient } = require('./src/services/cacheService');
      await getRedisClient().quit();
      logger.info('Redis connection closed');

      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', { error: err.message });
      process.exit(1);
    }
  });

  // Force exit after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
  process.exit(1);
});
