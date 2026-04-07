const cron = require('node-cron');
const User = require('../models/User.model');
const Meal = require('../models/Meal.model');
const Progress = require('../models/Progress.model');
const Notification = require('../models/Notification.model');
const { generateJSON } = require('../services/llmService');
const logger = require('../utils/logger');

/**
 * Generate and send a weekly nutrition summary for a single user.
 * @param {Object} user
 */
async function generateWeeklySummary(user) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  const progressDocs = await Progress.find({
    userId: user._id,
    date: { $gte: sevenDaysAgo },
  })
    .select('totalCalories calorieTarget')
    .lean();

  const daysLogged = progressDocs.length;
  if (daysLogged === 0) return;

  const avgCal = Math.round(progressDocs.reduce((s, p) => s + p.totalCalories, 0) / daysLogged);
  const targetCal = user.calorieTarget || 2000;

  const prompt = `Write a warm, motivating weekly nutrition summary for a user. Return JSON:
{
  "headline": "string — personalized weekly summary title",
  "summary": "string — 2 sentence overview of their week",
  "win_of_the_week": "string — their biggest positive",
  "focus_for_next_week": "string — one specific improvement",
  "streak_message": "string"
}
User stats this week: avg calories ${avgCal}, goal ${targetCal}, days logged ${daysLogged}/7, streak ${user.streak} days, name ${user.name}.`;

  try {
    const summary = await generateJSON(prompt);

    await Notification.create({
      userId: user._id,
      type: 'weekly_summary',
      message: summary.headline || 'Your weekly nutrition summary is ready!',
      data: summary,
    });

    logger.info('Weekly summary generated', { userId: user._id });
  } catch (err) {
    logger.error('Weekly summary generation failed', { userId: user._id, error: err.message });
  }
}

/**
 * Check if a user needs a meal reminder.
 * @param {Object} user
 */
async function sendMealReminder(user) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayMeals = await Meal.countDocuments({
    userId: user._id,
    loggedAt: { $gte: today, $lt: tomorrow },
  });

  if (todayMeals === 0) {
    // Check if we already sent a reminder today
    const existingReminder = await Notification.findOne({
      userId: user._id,
      type: 'meal_reminder',
      createdAt: { $gte: today },
    });

    if (!existingReminder) {
      await Notification.create({
        userId: user._id,
        type: 'meal_reminder',
        message: "Time for lunch! You haven't logged any meals today.",
      });
    }
  }

  // Streak alert — if user has a streak but hasn't logged today
  if (user.streak > 0 && todayMeals === 0) {
    const existingAlert = await Notification.findOne({
      userId: user._id,
      type: 'streak_alert',
      createdAt: { $gte: today },
    });

    if (!existingAlert) {
      await Notification.create({
        userId: user._id,
        type: 'streak_alert',
        message: `Log today to keep your ${user.streak}-day streak alive!`,
      });
    }
  }
}

// ── Cron Jobs ──────────────────────────────────────────────────────────────

// Sunday 8pm — weekly summary
cron.schedule('0 20 * * 0', async () => {
  logger.info('Running weekly summary cron job');
  const users = await User.find({ isActive: true, notificationsEnabled: true })
    .select('_id name calorieTarget streak')
    .lean();

  for (const user of users) {
    await generateWeeklySummary(user).catch((err) =>
      logger.error('Weekly summary cron error', { userId: user._id, error: err.message }),
    );
  }
});

// Daily noon — meal reminders + streak alerts
cron.schedule('0 12 * * *', async () => {
  logger.info('Running daily meal reminder cron job');
  const users = await User.find({ isActive: true, notificationsEnabled: true })
    .select('_id streak')
    .lean();

  for (const user of users) {
    await sendMealReminder(user).catch((err) =>
      logger.error('Meal reminder cron error', { userId: user._id, error: err.message }),
    );
  }
});

logger.info('Cron jobs initialized');

module.exports = { generateWeeklySummary, sendMealReminder };
