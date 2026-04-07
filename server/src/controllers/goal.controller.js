const Goal = require('../models/Goal.model');
const User = require('../models/User.model');
const { calculateNutritionTargets } = require('../services/nutritionService');
const { generateText } = require('../services/llmService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/goals/setup
 */
const setupGoal = asyncHandler(async (req, res) => {
  const { height, currentWeight, targetWeight, age, gender, activityLevel, goalType, targetDate } = req.body;

  const targets = calculateNutritionTargets({ height, weight: currentWeight, age, gender, activityLevel, goalType });

  // Get personalized LLM tips
  const prompt = `A user has set up their nutrition goal. Give 3 specific, actionable tips for their first week.
Goal: ${goalType.replace('_', ' ')}, Current weight: ${currentWeight}kg, Target: ${targetWeight}kg
Daily calorie target: ${targets.calorieTarget} kcal
Be concise, encouraging, and practical. Return just 3 numbered tips, no extra text.`;

  const tipsText = await generateText(prompt);
  const tips = tipsText
    .split('\n')
    .filter((l) => l.trim())
    .slice(0, 3);

  const goal = await Goal.findOneAndUpdate(
    { userId: req.user._id },
    {
      userId: req.user._id,
      height, currentWeight, targetWeight, age, gender, activityLevel, goalType,
      targetDate: targetDate ? new Date(targetDate) : null,
      ...targets,
      weeklyTips: tips,
    },
    { upsert: true, new: true, runValidators: true },
  );

  // Update user targets
  await User.findByIdAndUpdate(req.user._id, {
    height, weight: currentWeight, targetWeight, age, gender, activityLevel,
    goal: goalType,
    calorieTarget: targets.calorieTarget,
    proteinTarget: targets.proteinTarget,
    carbsTarget: targets.carbsTarget,
    fatTarget: targets.fatTarget,
  });

  res.status(201).json(new ApiResponse(201, { goal, tips }, 'Goal set up successfully'));
});

/**
 * PUT /api/goals/update
 */
const updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ userId: req.user._id });
  if (!goal) throw new ApiError(404, 'No goal found. Set up a goal first.');

  const allowed = ['currentWeight', 'targetWeight', 'activityLevel', 'goalType', 'targetDate', 'proteinPct', 'carbsPct', 'fatPct'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) goal[field] = req.body[field];
  });

  // Recalculate targets if key fields changed
  if (req.body.currentWeight || req.body.activityLevel || req.body.goalType) {
    const targets = calculateNutritionTargets({
      height: goal.height,
      weight: goal.currentWeight,
      age: goal.age,
      gender: goal.gender,
      activityLevel: goal.activityLevel,
      goalType: goal.goalType,
    });
    Object.assign(goal, targets);

    await User.findByIdAndUpdate(req.user._id, {
      weight: goal.currentWeight,
      calorieTarget: targets.calorieTarget,
      proteinTarget: targets.proteinTarget,
      carbsTarget: targets.carbsTarget,
      fatTarget: targets.fatTarget,
    });
  }

  await goal.save();
  res.json(new ApiResponse(200, goal, 'Goal updated'));
});

/**
 * GET /api/goals/progress
 */
const getGoalProgress = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ userId: req.user._id }).lean();
  if (!goal) throw new ApiError(404, 'No goal found');

  const user = await User.findById(req.user._id)
    .select('weight streak xp level badges')
    .lean();

  const weightLost = goal.currentWeight - (user.weight || goal.currentWeight);
  const weightToGo = Math.abs(goal.targetWeight - (user.weight || goal.currentWeight));
  const totalWeightChange = Math.abs(goal.currentWeight - goal.targetWeight);
  const progressPct = totalWeightChange > 0 ? Math.min(100, (Math.abs(weightLost) / totalWeightChange) * 100) : 0;

  res.json(
    new ApiResponse(200, {
      goal,
      weightLost,
      weightToGo,
      progressPct: Math.round(progressPct),
      currentStreak: user.streak,
      xp: user.xp,
      level: user.level,
      badges: user.badges,
    }, 'Goal progress fetched'),
  );
});

module.exports = { setupGoal, updateGoal, getGoalProgress };
