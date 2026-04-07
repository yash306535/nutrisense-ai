const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },

    // Daily totals
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 },
    totalFiber: { type: Number, default: 0 },
    mealCount: { type: Number, default: 0 },

    // Targets for the day
    calorieTarget: { type: Number, default: 2000 },
    proteinTarget: { type: Number, default: 150 },
    carbsTarget: { type: Number, default: 200 },
    fatTarget: { type: Number, default: 65 },

    // Goals met flags
    calorieGoalMet: { type: Boolean, default: false },
    proteinGoalMet: { type: Boolean, default: false },

    // Weight check-in (optional)
    weight: { type: Number, default: null },

    // XP earned this day
    xpEarned: { type: Number, default: 0 },
  },
  { timestamps: true },
);

progressSchema.index({ userId: 1, createdAt: -1 });
progressSchema.index({ userId: 1, date: -1 });

const Progress = mongoose.model('Progress', progressSchema);
module.exports = Progress;
