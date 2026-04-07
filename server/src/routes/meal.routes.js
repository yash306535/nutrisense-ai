const { Router } = require('express');
const { z } = require('zod');
const { logMeal, getTodayMeals, getMealHistory, getWeeklyProgress, deleteMeal } = require('../controllers/meal.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();
router.use(authenticate);

const logMealSchema = z.object({
  name: z.string().min(1).max(200),
  mealCategory: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).default(0),
  carbs: z.number().min(0).default(0),
  fat: z.number().min(0).default(0),
  fiber: z.number().min(0).default(0),
  sugar: z.number().min(0).default(0),
  sodium: z.number().min(0).default(0),
  healthScore: z.number().min(0).max(100).default(0),
  healthScoreReason: z.string().optional(),
  allergens: z.array(z.string()).default([]),
  healthierAlternatives: z.array(z.string()).default([]),
  source: z.enum(['manual', 'ai', 'barcode', 'ocr']).default('manual'),
  cuisine: z.string().optional(),
  isVegetable: z.boolean().default(false),
});

router.post('/', validate(logMealSchema), logMeal);
router.get('/today', getTodayMeals);
router.get('/history', getMealHistory);
router.get('/progress/weekly', getWeeklyProgress);
router.delete('/:id', deleteMeal);

module.exports = router;
