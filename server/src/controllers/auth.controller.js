const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { blacklistToken, isTokenBlacklisted } = require('../services/cacheService');
const logger = require('../utils/logger');

/**
 * Generate JWT access and refresh tokens for a user.
 * @param {string} userId
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
  return { accessToken, refreshToken };
}

/**
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email }).lean();
  if (existing) throw new ApiError(409, 'Email already registered');

  const user = await User.create({ name, email, password });
  const { accessToken, refreshToken } = generateTokens(user._id.toString());

  logger.info('User registered', { userId: user._id });

  res.status(201).json(
    new ApiResponse(201, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        badges: user.badges,
        calorieTarget: user.calorieTarget,
        goal: user.goal,
        allergies: user.allergies,
      },
      accessToken,
      refreshToken,
    }, 'Account created successfully'),
  );
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

  const { accessToken, refreshToken } = generateTokens(user._id.toString());

  logger.info('User logged in', { userId: user._id });

  res.json(
    new ApiResponse(200, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        badges: user.badges,
        calorieTarget: user.calorieTarget,
        proteinTarget: user.proteinTarget,
        carbsTarget: user.carbsTarget,
        fatTarget: user.fatTarget,
        goal: user.goal,
        allergies: user.allergies,
        dietaryRestrictions: user.dietaryRestrictions,
        height: user.height,
        weight: user.weight,
        age: user.age,
        gender: user.gender,
        activityLevel: user.activityLevel,
        targetWeight: user.targetWeight,
      },
      accessToken,
      refreshToken,
    }, 'Login successful'),
  );
});

/**
 * POST /api/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) throw new ApiError(400, 'Refresh token required');

  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) throw new ApiError(401, 'Refresh token revoked');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.userId).lean();
  if (!user || !user.isActive) throw new ApiError(401, 'User not found');

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

  // Blacklist old refresh token (7d TTL)
  await blacklistToken(token, 7 * 24 * 60 * 60);

  res.json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed'));
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.split(' ')[1];

  if (token) await blacklistToken(token, 7 * 24 * 60 * 60);
  if (accessToken) await blacklistToken(accessToken, 15 * 60);

  res.json(new ApiResponse(200, null, 'Logged out successfully'));
});

/**
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, req.user, 'User profile fetched'));
});

/**
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'bio', 'allergies', 'dietaryRestrictions', 'cuisinePreferences', 'notificationsEnabled'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (req.file) updates.avatar = `/uploads/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    .select('-password')
    .lean();

  res.json(new ApiResponse(200, user, 'Profile updated'));
});

/**
 * GET /api/auth/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const Notification = require('../models/Notification.model');
  const { lastId, limit = 20 } = req.query;
  const query = { userId: req.user._id };
  if (lastId) query._id = { $lt: lastId };

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

  res.json(new ApiResponse(200, { notifications, unreadCount }, 'Notifications fetched'));
});

/**
 * PATCH /api/auth/notifications/read-all
 */
const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const Notification = require('../models/Notification.model');
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  res.json(new ApiResponse(200, null, 'All notifications marked as read'));
});

module.exports = { register, login, refreshToken, logout, getMe, updateProfile, getNotifications, markAllNotificationsRead };
