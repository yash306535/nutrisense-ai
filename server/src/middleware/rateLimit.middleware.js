const { rateLimit } = require('express-rate-limit');

/**
 * AI endpoint rate limiter: 10 requests per minute per user.
 * Uses userId from JWT when authenticated, IP as fallback.
 */
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: (req) => {
    return req.user ? `user:${req.user._id}` : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests. Please wait a minute before trying again.',
  },
});

/**
 * Auth endpoint rate limiter: 10 requests per 15 minutes per IP.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});

module.exports = { aiRateLimiter, authRateLimiter };
