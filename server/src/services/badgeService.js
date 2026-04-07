const User = require('../models/User.model');
const Badge = require('../models/Badge.model');
const Notification = require('../models/Notification.model');
const Progress = require('../models/Progress.model');
const logger = require('../utils/logger');

const BADGE_DEFINITIONS = {
  first_meal: { name: 'First Meal', description: 'Logged your very first meal!', xp: 100 },
  seven_day_streak: { name: '7-Day Streak', description: 'Logged meals 7 days in a row!', xp: 100 },
  protein_champion: { name: 'Protein Champion', description: 'Hit protein goal 5 days in a row!', xp: 100 },
  veggie_lover: { name: 'Veggie Lover', description: 'Logged vegetables 10 days!', xp: 100 },
  goal_crusher: { name: 'Goal Crusher', description: 'Reached your target weight!', xp: 100 },
  nutribot_fan: { name: 'NutriBot Fan', description: 'Sent 20 NutriBot messages!', xp: 100 },
  explorer: { name: 'Explorer', description: 'Tried 10 different cuisines!', xp: 100 },
};

/**
 * Award a badge to a user if not already earned.
 * Creates a notification and adds XP.
 * @param {string} userId
 * @param {string} badgeId
 * @returns {Promise<Object|null>} Badge definition if newly awarded, else null
 */
async function awardBadge(userId, badgeId) {
  const user = await User.findById(userId).select('badges xp level name').lean();
  if (!user) return null;

  if (user.badges.includes(badgeId)) return null; // Already earned

  const badgeDef = BADGE_DEFINITIONS[badgeId];
  if (!badgeDef) return null;

  try {
    await Badge.create({ userId, badgeId });

    await User.findByIdAndUpdate(userId, {
      $push: { badges: badgeId },
      $inc: { xp: badgeDef.xp },
    });

    await Notification.create({
      userId,
      type: 'badge_awarded',
      message: `You just earned '${badgeDef.name}'! +${badgeDef.xp} XP`,
      data: { badgeId },
    });

    logger.info('Badge awarded', { userId, badgeId });
    return badgeDef;
  } catch (err) {
    if (err.code === 11000) return null; // Duplicate, ignore
    logger.error('Badge award error', { userId, badgeId, error: err.message });
    return null;
  }
}

/**
 * Check and award all applicable badges after a meal is logged.
 * @param {string} userId
 * @param {Object} meal
 * @returns {Promise<Array>} Array of newly awarded badge definitions
 */
async function awardBadgesForMeal(userId, meal) {
  const newBadges = [];
  const user = await User.findById(userId)
    .select('badges streak chatMessageCount cuisinesLogged veggieDaysLogged proteinGoalStreak xp')
    .lean();

  // First Meal badge
  if (!user.badges.includes('first_meal')) {
    const mealCount = await require('../models/Meal.model').countDocuments({ userId });
    if (mealCount >= 1) {
      const b = await awardBadge(userId, 'first_meal');
      if (b) newBadges.push(b);
    }
  }

  // 7-Day Streak badge
  if (!user.badges.includes('seven_day_streak') && user.streak >= 7) {
    const b = await awardBadge(userId, 'seven_day_streak');
    if (b) newBadges.push(b);
  }

  // Veggie Lover badge (10 days logging vegetables)
  if (!user.badges.includes('veggie_lover') && user.veggieDaysLogged >= 10) {
    const b = await awardBadge(userId, 'veggie_lover');
    if (b) newBadges.push(b);
  }

  // Explorer badge (10 different cuisines)
  if (!user.badges.includes('explorer') && (user.cuisinesLogged?.length || 0) >= 10) {
    const b = await awardBadge(userId, 'explorer');
    if (b) newBadges.push(b);
  }

  // Protein Champion: hit protein goal 5 days in a row
  if (!user.badges.includes('protein_champion')) {
    const recentProgress = await Progress.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .select('proteinGoalMet')
      .lean();

    if (recentProgress.length === 5 && recentProgress.every((p) => p.proteinGoalMet)) {
      const b = await awardBadge(userId, 'protein_champion');
      if (b) newBadges.push(b);
    }
  }

  // NutriBot Fan: 20 chat messages
  if (!user.badges.includes('nutribot_fan') && (user.chatMessageCount || 0) >= 20) {
    const b = await awardBadge(userId, 'nutribot_fan');
    if (b) newBadges.push(b);
  }

  return newBadges;
}

/**
 * Check Goal Crusher badge when weight is updated.
 * @param {string} userId
 * @param {number} currentWeight
 * @param {number} targetWeight
 * @param {'lose_weight'|'maintain'|'gain_muscle'} goalType
 */
async function checkGoalCrusher(userId, currentWeight, targetWeight, goalType) {
  let achieved = false;
  if (goalType === 'lose_weight' && currentWeight <= targetWeight) achieved = true;
  if (goalType === 'gain_muscle' && currentWeight >= targetWeight) achieved = true;

  if (achieved) {
    await awardBadge(userId, 'goal_crusher');
    await Notification.create({
      userId,
      type: 'goal_milestone',
      message: "You reached your target weight! Amazing work!",
    });
  }
}

module.exports = { awardBadge, awardBadgesForMeal, checkGoalCrusher, BADGE_DEFINITIONS };
