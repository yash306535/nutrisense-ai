const { generateJSON, generateText } = require('../services/llmService');
const ChatMessage = require('../models/ChatMessage.model');
const Meal = require('../models/Meal.model');
const User = require('../models/User.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * POST /api/ai/analyze-meal
 * Analyze a meal description using LLM and return structured nutrition data.
 */
const analyzeMeal = asyncHandler(async (req, res) => {
  const { mealInput } = req.body;

  const prompt = `You are a professional nutritionist AI. Analyze the following meal and return ONLY valid JSON with no explanation.

Meal input: "${mealInput}"

Return exactly this JSON schema:
{
  "name": "string — cleaned meal name",
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "fiber_g": number,
  "sugar_g": number,
  "sodium_mg": number,
  "health_score": number between 0 and 100,
  "health_score_reason": "string — 1 sentence explanation",
  "allergens": ["array of detected allergens"],
  "healthier_alternatives": ["3 alternative foods or tweaks"],
  "meal_category": "breakfast or lunch or dinner or snack"
}`;

  const result = await generateJSON(prompt);

  res.json(new ApiResponse(200, result, 'Meal analyzed successfully'));
});

/**
 * POST /api/ai/chat
 * NutriBot conversational AI with context from user profile and history.
 */
const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;

  const user = await User.findById(req.user._id)
    .select('name goal calorieTarget allergies')
    .lean();

  // Get today's calorie intake
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayMeals = await Meal.find({
    userId: req.user._id,
    loggedAt: { $gte: today, $lt: tomorrow },
  }).select('calories').lean();

  const todayCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);

  // Get last 6 chat messages
  const chatHistory = await ChatMessage.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(6)
    .select('role content')
    .lean();

  chatHistory.reverse();

  const prompt = `You are NutriBot, a friendly and encouraging AI dietitian inside the NutriSense app.

User profile:
- Name: ${user.name}
- Goal: ${user.goal?.replace('_', ' ') || 'maintain'}
- Daily calorie target: ${user.calorieTarget} kcal
- Allergies: ${user.allergies?.join(', ') || 'none'}
- Today's intake so far: ${todayCalories} kcal of ${user.calorieTarget} kcal

Recent chat history:
${chatHistory.map((m) => `${m.role}: ${m.content}`).join('\n')}

User's new message: "${message}"

Respond in 2-4 sentences. Be specific, friendly, actionable. Reference the user's data when helpful.`;

  const responseText = await generateText(prompt);

  // Persist both messages
  await ChatMessage.create([
    { userId: req.user._id, role: 'user', content: message },
    { userId: req.user._id, role: 'assistant', content: responseText },
  ]);

  // Increment chat message count for badge tracking
  await User.findByIdAndUpdate(req.user._id, { $inc: { chatMessageCount: 1 } });

  res.json(new ApiResponse(200, { reply: responseText }, 'Chat response generated'));
});

/**
 * GET /api/ai/chat-history
 */
const getChatHistory = asyncHandler(async (req, res) => {
  const { lastId, limit = 30 } = req.query;
  const query = { userId: req.user._id };
  if (lastId) query._id = { $lt: lastId };

  const messages = await ChatMessage.find(query)
    .select('role content createdAt')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  messages.reverse();

  res.json(new ApiResponse(200, { messages }, 'Chat history fetched'));
});

/**
 * DELETE /api/ai/chat-history
 */
const clearChatHistory = asyncHandler(async (req, res) => {
  await ChatMessage.deleteMany({ userId: req.user._id });
  res.json(new ApiResponse(200, null, 'Chat history cleared'));
});

/**
 * POST /api/ai/meal-plan
 * Generate a multi-day meal plan using LLM.
 */
const generateMealPlan = asyncHandler(async (req, res) => {
  const { days = 7, cuisine = 'Mediterranean', restrictions = [], calorieTarget, goal } = req.body;

  const userCalTarget = calorieTarget || req.user.calorieTarget || 2000;
  const userGoal = goal || req.user.goal || 'maintain';

  const prompt = `You are a certified meal planning nutritionist. Create a ${days}-day meal plan.

User preferences:
- Cuisine: ${cuisine}
- Dietary restrictions: ${restrictions.join(', ') || 'none'}
- Daily calorie target: ${userCalTarget} kcal
- Goal: ${userGoal.replace('_', ' ')}

Return ONLY a JSON array (no explanation):
[
  {
    "day": 1,
    "breakfast": { "name": "string", "calories": number, "prep_time_min": number },
    "lunch": { "name": "string", "calories": number, "prep_time_min": number },
    "dinner": { "name": "string", "calories": number, "prep_time_min": number },
    "snack": { "name": "string", "calories": number },
    "total_calories": number
  }
]
Return ${days} items in the array. Vary meals — no repeats.`;

  const plan = await generateJSON(prompt);

  res.json(new ApiResponse(200, { plan }, 'Meal plan generated'));
});

/**
 * POST /api/ai/check-allergens
 */
const checkAllergens = asyncHandler(async (req, res) => {
  const { mealDescription, allergens } = req.body;
  const userAllergens = allergens || req.user.allergies || [];

  const prompt = `Check this meal/recipe for allergens. User's allergen profile: ${userAllergens.join(', ') || 'none'}.

Meal: "${mealDescription}"

Return ONLY JSON:
{
  "contains_allergens": boolean,
  "detected": ["list of allergens found"],
  "safe_alternatives": ["ingredient substitutions to make it safe"],
  "risk_level": "none or low or high"
}`;

  const result = await generateJSON(prompt);

  res.json(new ApiResponse(200, result, 'Allergen check complete'));
});

/**
 * POST /api/ai/healthify-recipe
 */
const healthifyRecipe = asyncHandler(async (req, res) => {
  const { recipe } = req.body;

  const prompt = `Rewrite this recipe to be healthier while keeping the same cuisine style.
Original: ${JSON.stringify(recipe)}
Make these improvements: reduce sodium, replace refined carbs, add fiber, reduce saturated fat.
Return the same JSON schema with updated values and a "changes_made" string field explaining modifications.
Return ONLY valid JSON.`;

  const result = await generateJSON(prompt);

  res.json(new ApiResponse(200, result, 'Recipe healthified'));
});

/**
 * POST /api/ai/insights
 * Generate AI-powered habit insights from last 30 days of meal data.
 */
const generateInsights = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const meals = await Meal.find({
    userId: req.user._id,
    loggedAt: { $gte: thirtyDaysAgo },
  })
    .select('name mealCategory calories protein carbs fat healthScore loggedAt cuisine')
    .lean();

  if (meals.length === 0) {
    return res.json(
      new ApiResponse(200, {
        top_insight: 'Start logging meals to get personalized insights!',
        patterns: [],
        weekly_avg_calories: 0,
        best_day_of_week: 'N/A',
        worst_day_of_week: 'N/A',
        protein_consistency_score: 0,
        actionable_tips: ['Log your first meal to unlock insights.'],
      }, 'No data available'),
    );
  }

  // Aggregate summary for prompt
  const mealSummary = {
    totalMeals: meals.length,
    avgCalories: Math.round(meals.reduce((s, m) => s + m.calories, 0) / meals.length),
    avgProtein: Math.round(meals.reduce((s, m) => s + m.protein, 0) / meals.length),
    avgHealthScore: Math.round(meals.reduce((s, m) => s + m.healthScore, 0) / meals.length),
    topCategories: [...new Set(meals.map((m) => m.mealCategory))],
    daysLogged: new Set(meals.map((m) => new Date(m.loggedAt).toDateString())).size,
    calorieTarget: req.user.calorieTarget,
  };

  const prompt = `You are a nutrition data analyst. Analyze this user's 30-day eating history and return insights as JSON.

Meal history summary:
${JSON.stringify(mealSummary)}

Return ONLY JSON:
{
  "top_insight": "string — most impactful finding in 1 sentence",
  "patterns": [
    { "title": "string", "description": "string", "type": "positive or negative or neutral" }
  ],
  "weekly_avg_calories": number,
  "best_day_of_week": "string",
  "worst_day_of_week": "string",
  "protein_consistency_score": number 0-100,
  "actionable_tips": ["tip1", "tip2", "tip3"]
}
Return exactly 4 patterns.`;

  const insights = await generateJSON(prompt);

  res.json(new ApiResponse(200, insights, 'Insights generated'));
});

/**
 * POST /api/ai/caption
 * Generate a social media caption for a meal post.
 */
const generateCaption = asyncHandler(async (req, res) => {
  const { mealName, healthScore } = req.body;

  const prompt = `Generate a short, upbeat social media caption (max 15 words) for sharing this meal: ${mealName} (Health score: ${healthScore}/100). Return only the caption text, no quotes.`;

  const caption = await generateText(prompt);

  res.json(new ApiResponse(200, { caption: caption.trim() }, 'Caption generated'));
});

module.exports = {
  analyzeMeal,
  chat,
  getChatHistory,
  clearChatHistory,
  generateMealPlan,
  checkAllergens,
  healthifyRecipe,
  generateInsights,
  generateCaption,
};
