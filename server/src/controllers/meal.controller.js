const Meal = require('../models/Meal.model');
const Progress = require('../models/Progress.model');
const User = require('../models/User.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { awardBadgesForMeal } = require('../services/badgeService');
const logger = require('../utils/logger');

/**
 * Get start and end of today in UTC.
 */
function getTodayRange() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Upsert today's progress document.
 * @param {string} userId
 * @param {Object} meal
 * @param {Object} userTargets
 */
async function updateProgress(userId, meal, userTargets) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const progress = await Progress.findOneAndUpdate(
    { userId, date: today },
    {
      $inc: {
        totalCalories: meal.calories || 0,
        totalProtein: meal.protein || 0,
        totalCarbs: meal.carbs || 0,
        totalFat: meal.fat || 0,
        totalFiber: meal.fiber || 0,
        mealCount: 1,
        xpEarned: 10,
      },
      $setOnInsert: {
        calorieTarget: userTargets.calorieTarget || 2000,
        proteinTarget: userTargets.proteinTarget || 150,
        carbsTarget: userTargets.carbsTarget || 200,
        fatTarget: userTargets.fatTarget || 65,
      },
    },
    { upsert: true, new: true },
  );

  // Check if goals are met
  const proteinMet = progress.totalProtein >= progress.proteinTarget;
  const calorieMet =
    progress.totalCalories >= progress.calorieTarget * 0.9 &&
    progress.totalCalories <= progress.calorieTarget * 1.1;

  if (proteinMet !== progress.proteinGoalMet || calorieMet !== progress.calorieGoalMet) {
    await Progress.findByIdAndUpdate(progress._id, {
      proteinGoalMet: proteinMet,
      calorieGoalMet: calorieMet,
    });

    if (calorieMet) {
      await User.findByIdAndUpdate(userId, { $inc: { xp: 50 } });
    }
  }

  return progress;
}

/**
 * POST /api/meals
 */
const logMeal = asyncHandler(async (req, res) => {
  const { name, mealCategory, calories, protein, carbs, fat, fiber, sugar, sodium,
    healthScore, healthScoreReason, allergens, healthierAlternatives, source, cuisine, isVegetable } = req.body;

  const meal = await Meal.create({
    userId: req.user._id,
    name, mealCategory, calories, protein, carbs, fat, fiber, sugar, sodium,
    healthScore: healthScore || 0,
    healthScoreReason: healthScoreReason || '',
    allergens: allergens || [],
    healthierAlternatives: healthierAlternatives || [],
    source: source || 'manual',
    cuisine: cuisine || null,
    isVegetable: isVegetable || false,
  });

  // Update streak
  const user = await User.findById(req.user._id).select('lastLogDate streak longestStreak xp level badges cuisinesLogged veggieDaysLogged');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let streakInc = 0;
  let xpInc = 10; // base meal XP

  if (user.lastLogDate) {
    const lastLog = new Date(user.lastLogDate);
    lastLog.setUTCHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - lastLog) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      streakInc = 1;
      xpInc += 25; // streak XP
    } else if (diffDays > 1) {
      // Streak broken
      await User.findByIdAndUpdate(req.user._id, { streak: 1 });
    }
  } else {
    streakInc = 1;
  }

  // Track cuisines for Explorer badge
  const cuisineUpdates = {};
  if (cuisine && !user.cuisinesLogged.includes(cuisine)) {
    cuisineUpdates.$addToSet = { cuisinesLogged: cuisine };
  }
  if (isVegetable) {
    cuisineUpdates.$inc = { ...(cuisineUpdates.$inc || {}), veggieDaysLogged: 1 };
  }

  await User.findByIdAndUpdate(req.user._id, {
    lastLogDate: today,
    ...(streakInc ? { $inc: { streak: streakInc, xp: xpInc } } : { $inc: { xp: xpInc } }),
    ...cuisineUpdates,
  });

  // Update progress
  await updateProgress(req.user._id, meal, {
    calorieTarget: req.user.calorieTarget,
    proteinTarget: req.user.proteinTarget,
    carbsTarget: req.user.carbsTarget,
    fatTarget: req.user.fatTarget,
  });

  // Check and award badges
  const newBadges = await awardBadgesForMeal(req.user._id, meal);

  res.status(201).json(new ApiResponse(201, { meal, newBadges }, 'Meal logged successfully'));
});

/**
 * GET /api/meals/today
 */
const getTodayMeals = asyncHandler(async (req, res) => {
  const { start, end } = getTodayRange();

  const meals = await Meal.find({ userId: req.user._id, loggedAt: { $gte: start, $lte: end } })
    .select('name mealCategory calories protein carbs fat fiber healthScore allergens loggedAt source')
    .sort({ loggedAt: 1 })
    .lean();

  const totals = meals.reduce(
    (acc, m) => {
      acc.calories += m.calories || 0;
      acc.protein += m.protein || 0;
      acc.carbs += m.carbs || 0;
      acc.fat += m.fat || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  res.json(new ApiResponse(200, { meals, totals }, 'Today\'s meals fetched'));
});

/**
 * GET /api/meals/history
 */
const getMealHistory = asyncHandler(async (req, res) => {
  const { lastId, limit = 20, from, to } = req.query;
  const query = { userId: req.user._id };

  if (lastId) query._id = { $lt: lastId };
  if (from || to) {
    query.loggedAt = {};
    if (from) query.loggedAt.$gte = new Date(from);
    if (to) query.loggedAt.$lte = new Date(to);
  }

  const meals = await Meal.find(query)
    .select('name mealCategory calories protein carbs fat healthScore loggedAt source')
    .sort({ loggedAt: -1 })
    .limit(Number(limit))
    .lean();

  res.json(new ApiResponse(200, { meals, hasMore: meals.length === Number(limit) }, 'Meal history fetched'));
});

/**
 * GET /api/meals/progress/weekly
 */
const getWeeklyProgress = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  const progress = await Progress.find({
    userId: req.user._id,
    date: { $gte: sevenDaysAgo },
  })
    .select('date totalCalories totalProtein totalCarbs totalFat mealCount calorieTarget proteinTarget xpEarned')
    .sort({ date: 1 })
    .lean();

  res.json(new ApiResponse(200, { progress }, 'Weekly progress fetched'));
});

/**
 * DELETE /api/meals/:id
 */
const deleteMeal = asyncHandler(async (req, res) => {
  const meal = await Meal.findOne({ _id: req.params.id, userId: req.user._id });
  if (!meal) throw new ApiError(404, 'Meal not found');

  await meal.deleteOne();
  res.json(new ApiResponse(200, null, 'Meal deleted'));
});

module.exports = { logMeal, getTodayMeals, getMealHistory, getWeeklyProgress, deleteMeal };
