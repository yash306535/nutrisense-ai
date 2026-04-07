const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'meal_reminder',
        'hydration',
        'streak_alert',
        'weekly_summary',
        'badge_awarded',
        'goal_milestone',
        'social_like',
        'social_comment',
      ],
      required: true,
    },
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
