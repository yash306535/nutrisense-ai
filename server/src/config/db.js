const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB using the URI from environment variables.
 * Exits process if connection fails on initial attempt.
 * @returns {Promise<void>}
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error('MongoDB connection error', { error: err.message });
    process.exit(1);
  }
}

module.exports = { connectDB };
