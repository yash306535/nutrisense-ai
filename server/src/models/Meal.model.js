const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    mealCategory: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
    },

    // Nutrition data
    calories: { type: Number, required: true, default: 0 },
    protein: { type: Number, default: 0 }, // grams
    carbs: { type: Number, default: 0 }, // grams
    fat: { type: Number, default: 0 }, // grams
    fiber: { type: Number, default: 0 }, // grams
    sugar: { type: Number, default: 0 }, // grams
    sodium: { type: Number, default: 0 }, // mg

    // AI analysis
    healthScore: { type: Number, default: 0, min: 0, max: 100 },
    healthScoreReason: { type: String, default: '' },
    allergens: [{ type: String }],
    healthierAlternatives: [{ type: String }],

    // Source of this meal
    source: { type: String, enum: ['manual', 'ai', 'barcode', 'ocr'], default: 'ai' },
    imageUrl: { type: String, default: null },

    // Metadata
    cuisine: { type: String, default: null },
    isVegetable: { type: Boolean, default: false },

    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Indexes for efficient queries
mealSchema.index({ userId: 1, createdAt: -1 });
mealSchema.index({ userId: 1, loggedAt: -1 });
mealSchema.index({ userId: 1, mealCategory: 1 });

const Meal = mongoose.model('Meal', mealSchema);
module.exports = Meal;
