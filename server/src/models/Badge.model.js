const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    badgeId: {
      type: String,
      required: true,
      enum: [
        'first_meal',
        'seven_day_streak',
        'protein_champion',
        'veggie_lover',
        'goal_crusher',
        'nutribot_fan',
        'explorer',
      ],
    },
    awardedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

badgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

const Badge = mongoose.model('Badge', badgeSchema);
module.exports = Badge;
