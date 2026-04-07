const { Router } = require('express');
const { searchRecipes, getRecipeById } = require('../controllers/recipe.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { aiRateLimiter } = require('../middleware/rateLimit.middleware');

const router = Router();
router.use(authenticate);
router.use(aiRateLimiter);

router.get('/search', searchRecipes);
router.get('/:id', getRecipeById);

module.exports = router;
