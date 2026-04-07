const Redis = require('ioredis');
const logger = require('../utils/logger');

let client = null;

/**
 * Initialize Redis client singleton.
 * @returns {Redis} Redis client instance
 */
function getRedisClient() {
  if (!process.env.REDIS_URL) return null; // Redis disabled
  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        if (times > 5) {
          logger.error('Redis connection failed after 5 retries');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    client.on('connect', () => logger.info('Redis connected'));
    client.on('error', (err) => logger.error('Redis error', { error: err.message }));
    client.on('close', () => logger.warn('Redis connection closed'));
  }
  return client;
}

/**
 * Get a value from Redis cache.
 * @param {string} key - Cache key
 * @returns {Promise<string|null>} Cached value or null
 */
async function getCached(key) {
  try {
    const redis = getRedisClient();
    if (!redis) return null;
    return await redis.get(key);
  } catch (err) {
    logger.error('getCached error', { key, error: err.message });
    return null;
  }
}

async function setCached(key, value, ttl) {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    if (ttl) {
      await redis.set(key, value, 'EX', ttl);
    } else {
      await redis.set(key, value);
    }
  } catch (err) {
    logger.error('setCached error', { key, error: err.message });
  }
}

async function deleteCached(key) {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    await redis.del(key);
  } catch (err) {
    logger.error('deleteCached error', { key, error: err.message });
  }
}

/**
 * Add a token to the Redis blacklist (for refresh token invalidation).
 * @param {string} token - Token to blacklist
 * @param {number} ttl - TTL in seconds
 * @returns {Promise<void>}
 */
async function blacklistToken(token, ttl) {
  await setCached(`blacklist:${token}`, '1', ttl);
}

async function isTokenBlacklisted(token) {
  const val = await getCached(`blacklist:${token}`);
  return val === '1';
}

async function isRedisConnected() {
  try {
    const redis = getRedisClient();
    if (!redis) return false;
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

module.exports = {
  getRedisClient,
  getCached,
  setCached,
  deleteCached,
  blacklistToken,
  isTokenBlacklisted,
  isRedisConnected,
};
