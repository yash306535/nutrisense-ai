const { generateJSON } = require('../services/llmService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/recipes/search
 */
const searchRecipes = asyncHandler(async (req, res) => {
  const { q = 'healthy', diet = 'balanced', maxCalories = 600 } = req.query;

  const userRestrictions = req.user.dietaryRestrictions?.join(', ') || 'none';

  const prompt = `Generate 6 healthy recipes matching: query="${q}", diet="${diet}", max calories per serving=${maxCalories}.
User dietary restrictions: ${userRestrictions}
Return ONLY a JSON array:
[{
  "id": "unique_string_id",
  "name": "string",
  "calories_per_serving": number,
  "prep_time_min": number,
  "cuisine": "string",
  "diet_tags": ["vegan","gluten-free"],
  "ingredients": ["ingredient 1", "ingredient 2"],
  "steps": ["step 1", "step 2", "step 3"],
  "health_score": number between 0 and 100,
  "nutrition_per_serving": { "protein_g": number, "carbs_g": number, "fat_g": number, "fiber_g": number }
}]`;

  const recipes = await generateJSON(prompt, { maxTokens: 6144 });

  res.json(new ApiResponse(200, { recipes: Array.isArray(recipes) ? recipes : [recipes] }, 'Recipes fetched'));
});

/**
 * POST /api/ai/healthify-recipe — handled in ai.controller.js
 * GET /api/recipes/:id — return a single generated recipe
 */
const getRecipeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.query;

  if (!name) {
    return res.json(new ApiResponse(404, null, 'Recipe not found'));
  }

  const prompt = `Generate a single detailed healthy recipe for: "${name}".
Return ONLY a JSON object:
{
  "id": "${id}",
  "name": "string",
  "calories_per_serving": number,
  "prep_time_min": number,
  "cuisine": "string",
  "diet_tags": ["vegan","gluten-free"],
  "ingredients": ["ingredient 1 with quantity"],
  "steps": ["detailed step 1", "detailed step 2"],
  "health_score": number between 0 and 100,
  "nutrition_per_serving": {
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "fiber_g": number
  }
}`;

  const recipe = await generateJSON(prompt);

  res.json(new ApiResponse(200, recipe, 'Recipe fetched'));
});

module.exports = { searchRecipes, getRecipeById };
