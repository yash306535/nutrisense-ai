const { Router } = require('express');
const { z } = require('zod');
const { setupGoal, updateGoal, getGoalProgress } = require('../controllers/goal.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();
router.use(authenticate);

const setupSchema = z.object({
  height: z.number().min(50).max(300),
  currentWeight: z.number().min(20).max(500),
  targetWeight: z.number().min(20).max(500),
  age: z.number().min(10).max(120),
  gender: z.enum(['male', 'female', 'other']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goalType: z.enum(['lose_weight', 'maintain', 'gain_muscle']),
  targetDate: z.string().optional(),
});

router.post('/setup', validate(setupSchema), setupGoal);
router.put('/update', updateGoal);
router.get('/progress', getGoalProgress);

module.exports = router;
