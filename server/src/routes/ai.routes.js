const { Router } = require('express');
const { z } = require('zod');
const {
  analyzeMeal, chat, getChatHistory, clearChatHistory,
  generateMealPlan, checkAllergens, healthifyRecipe, generateInsights, generateCaption,
} = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { aiRateLimiter } = require('../middleware/rateLimit.middleware');

const router = Router();
router.use(authenticate);
router.use(aiRateLimiter);

router.post('/analyze-meal', validate(z.object({ mealInput: z.string().min(1).max(500) })), analyzeMeal);
router.post('/chat', validate(z.object({ message: z.string().min(1).max(1000) })), chat);
router.get('/chat-history', getChatHistory);
router.delete('/chat-history', clearChatHistory);
router.post('/meal-plan', validate(z.object({
  days: z.number().min(1).max(14).default(7),
  cuisine: z.string().default('Mediterranean'),
  restrictions: z.array(z.string()).default([]),
  calorieTarget: z.number().optional(),
  goal: z.string().optional(),
})), generateMealPlan);
router.post('/check-allergens', validate(z.object({
  mealDescription: z.string().min(1),
  allergens: z.array(z.string()).optional(),
})), checkAllergens);
router.post('/healthify-recipe', validate(z.object({ recipe: z.record(z.unknown()) })), healthifyRecipe);
router.post('/insights', generateInsights);
router.post('/caption', validate(z.object({
  mealName: z.string().min(1),
  healthScore: z.number().min(0).max(100),
})), generateCaption);

module.exports = router;
