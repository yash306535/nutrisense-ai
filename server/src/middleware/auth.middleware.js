const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User.model');
const { isTokenBlacklisted } = require('../services/cacheService');

/**
 * Middleware to verify JWT access token and attach user to req.user.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Access token required');
  }

  const token = authHeader.split(' ')[1];

  // Check if token is blacklisted
  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) {
    throw new ApiError(401, 'Token has been revoked');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Access token expired');
    }
    throw new ApiError(401, 'Invalid access token');
  }

  const user = await User.findById(decoded.userId)
    .select('-password')
    .lean();

  if (!user || !user.isActive) {
    throw new ApiError(401, 'User not found or deactivated');
  }

  req.user = user;
  next();
});

module.exports = { authenticate };
