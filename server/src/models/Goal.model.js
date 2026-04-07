const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    // Physical measurements
    height: { type: Number, required: true }, // cm
    currentWeight: { type: Number, required: true }, // kg
    targetWeight: { type: Number, required: true }, // kg
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },

    // Activity and goal
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
      required: true,
    },
    goalType: {
      type: String,
      enum: ['lose_weight', 'maintain', 'gain_muscle'],
      required: true,
    },
    targetDate: { type: Date, default: null },

    // Calculated targets
    bmr: { type: Number },
    tdee: { type: Number },
    calorieTarget: { type: Number },
    proteinTarget: { type: Number },
    carbsTarget: { type: Number },
    fatTarget: { type: Number },

    // Macro split (percentages)
    proteinPct: { type: Number, default: 30 },
    carbsPct: { type: Number, default: 40 },
    fatPct: { type: Number, default: 30 },

    // AI-generated tips
    weeklyTips: [{ type: String }],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

goalSchema.index({ userId: 1 });

const Goal = mongoose.model('Goal', goalSchema);
module.exports = Goal;
