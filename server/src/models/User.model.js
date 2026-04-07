const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: { type: String, default: null },
    bio: { type: String, maxlength: 300, default: '' },

    // Health profile
    height: { type: Number, default: null }, // cm
    weight: { type: Number, default: null }, // kg
    age: { type: Number, default: null },
    gender: { type: String, enum: ['male', 'female', 'other'], default: null },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
      default: 'moderate',
    },
    goal: {
      type: String,
      enum: ['lose_weight', 'maintain', 'gain_muscle'],
      default: 'maintain',
    },
    calorieTarget: { type: Number, default: 2000 },
    proteinTarget: { type: Number, default: 150 }, // grams
    carbsTarget: { type: Number, default: 200 }, // grams
    fatTarget: { type: Number, default: 65 }, // grams
    targetWeight: { type: Number, default: null },

    // Allergies / dietary preferences
    allergies: [{ type: String }],
    dietaryRestrictions: [{ type: String }],
    cuisinePreferences: [{ type: String }],

    // Gamification
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastLogDate: { type: Date, default: null },
    badges: [{ type: String }],

    // Social
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    chatMessageCount: { type: Number, default: 0 },
    cuisinesLogged: [{ type: String }],
    veggieDaysLogged: { type: Number, default: 0 },
    proteinGoalStreak: { type: Number, default: 0 },

    // Notifications
    notificationsEnabled: { type: Boolean, default: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ xp: -1 });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/**
 * Compare a plain-text password with the stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Calculate user level based on XP thresholds.
 * @returns {number}
 */
userSchema.methods.calculateLevel = function () {
  const thresholds = [0, 200, 500, 1000, 2000, 3500, 5500, 7500, 9000, 10000];
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (this.xp >= thresholds[i]) level = i + 1;
  }
  return Math.min(level, 10);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
