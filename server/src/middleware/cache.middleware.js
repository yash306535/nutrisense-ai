const { getCached, setCached } = require('../services/cacheService');
const logger = require('../utils/logger');

/**
 * Cache-aside middleware for GET endpoints.
 * Checks Redis first; on miss, sets response in cache after controller runs.
 * @param {number} ttl - Cache TTL in seconds
 * @param {Function} [keyFn] - Custom key generator (req) => string
 */
const cacheMiddleware = (ttl = 300, keyFn = null) => async (req, res, next) => {
  const key = keyFn ? keyFn(req) : `cache:${req.originalUrl}:${req.user?._id || 'anon'}`;

  try {
    const cached = await getCached(key);
    if (cached) {
      logger.info('Cache hit', { key });
      return res.json(JSON.parse(cached));
    }
  } catch (err) {
    logger.error('Cache middleware read error', { error: err.message });
  }

  // Override res.json to capture and cache the response
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    try {
      if (res.statusCode < 400) {
        await setCached(key, JSON.stringify(data), ttl);
      }
    } catch (err) {
      logger.error('Cache middleware write error', { error: err.message });
    }
    return originalJson(data);
  };

  next();
};

module.exports = { cacheMiddleware };
