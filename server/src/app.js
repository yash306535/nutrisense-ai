const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { rateLimit } = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');

const logger = require('./utils/logger');
const ApiError = require('./utils/ApiError');
const ApiResponse = require('./utils/ApiResponse');
const { isRedisConnected } = require('./services/cacheService');

// Routes
const authRoutes = require('./routes/auth.routes');
const mealRoutes = require('./routes/meal.routes');
const aiRoutes = require('./routes/ai.routes');
const goalRoutes = require('./routes/goal.routes');
const recipeRoutes = require('./routes/recipe.routes');
const socialRoutes = require('./routes/social.routes');

const app = express();

// ── Security & Performance ─────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Files (uploads) ─────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ── Global Rate Limiter ────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisState = (await isRedisConnected()) ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    db: dbState,
    redis: redisState,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/social', socialRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json(new ApiResponse(404, null, `Route ${req.originalUrl} not found`));
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      errors: [],
    });
  }

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    errors: [],
  });
});

module.exports = app;
