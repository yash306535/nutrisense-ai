const Redis = require('ioredis');
const logger = require('../utils/logger');

let client = null;

/**
 * Initialize Redis client singleton.
 * @returns {Redis} Redis client instance
 */
function getRedisClient() {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
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
    return await redis.get(key);
  } catch (err) {
    logger.error('getCached error', { key, error: err.message });
    return null;
  }
}

/**
 * Set a value in Redis cache with optional TTL.
 * @param {string} key - Cache key
 * @param {string} value - Value to cache (string)
 * @param {number} [ttl] - TTL in seconds (optional)
 * @returns {Promise<void>}
 */
async function setCached(key, value, ttl) {
  try {
    const redis = getRedisClient();
    if (ttl) {
      await redis.set(key, value, 'EX', ttl);
    } else {
      await redis.set(key, value);
    }
  } catch (err) {
    logger.error('setCached error', { key, error: err.message });
  }
}

/**
 * Delete a key from Redis cache.
 * @param {string} key - Cache key
 * @returns {Promise<void>}
 */
async function deleteCached(key) {
  try {
    const redis = getRedisClient();
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

/**
 * Check if a token is blacklisted.
 * @param {string} token - Token to check
 * @returns {Promise<boolean>}
 */
async function isTokenBlacklisted(token) {
  const val = await getCached(`blacklist:${token}`);
  return val === '1';
}

/**
 * Check Redis connection status.
 * @returns {Promise<boolean>}
 */
async function isRedisConnected() {
  try {
    const redis = getRedisClient();
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
