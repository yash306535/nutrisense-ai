/**
 * Calculate BMR using Mifflin-St Jeor equation.
 * @param {Object} params
 * @param {number} params.weight - Weight in kg
 * @param {number} params.height - Height in cm
 * @param {number} params.age - Age in years
 * @param {'male'|'female'|'other'} params.gender
 * @returns {number} BMR in kcal/day
 */
function calculateBMR({ weight, height, age, gender }) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'male') return base + 5;
  if (gender === 'female') return base - 161;
  return base - 78; // Average for 'other'
}

/**
 * Activity level multipliers for TDEE calculation.
 */
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * Calculate daily calorie and macro targets based on user profile.
 * @param {Object} params
 * @param {number} params.weight
 * @param {number} params.height
 * @param {number} params.age
 * @param {string} params.gender
 * @param {string} params.activityLevel
 * @param {'lose_weight'|'maintain'|'gain_muscle'} params.goalType
 * @param {number} [params.proteinPct=30]
 * @param {number} [params.carbsPct=40]
 * @param {number} [params.fatPct=30]
 * @returns {{bmr, tdee, calorieTarget, proteinTarget, carbsTarget, fatTarget}}
 */
function calculateNutritionTargets({ weight, height, age, gender, activityLevel, goalType, proteinPct = 30, carbsPct = 40, fatPct = 30 }) {
  const bmr = Math.round(calculateBMR({ weight, height, age, gender }));
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  const tdee = Math.round(bmr * multiplier);

  let calorieTarget;
  switch (goalType) {
    case 'lose_weight':
      calorieTarget = Math.round(tdee - 500); // ~0.5kg/week deficit
      break;
    case 'gain_muscle':
      calorieTarget = Math.round(tdee + 300); // Lean bulk surplus
      break;
    case 'maintain':
    default:
      calorieTarget = tdee;
  }

  // Ensure minimum healthy calories
  calorieTarget = Math.max(calorieTarget, gender === 'female' ? 1200 : 1500);

  // Macro targets in grams
  const proteinTarget = Math.round((calorieTarget * proteinPct) / 100 / 4); // 4 kcal/g
  const carbsTarget = Math.round((calorieTarget * carbsPct) / 100 / 4); // 4 kcal/g
  const fatTarget = Math.round((calorieTarget * fatPct) / 100 / 9); // 9 kcal/g

  return { bmr, tdee, calorieTarget, proteinTarget, carbsTarget, fatTarget };
}

/**
 * Calculate percentage of daily goal met.
 * @param {number} actual
 * @param {number} target
 * @returns {number} percentage 0-100+
 */
function calculateGoalPercentage(actual, target) {
  if (!target) return 0;
  return Math.round((actual / target) * 100);
}

/**
 * Get level thresholds and XP required for next level.
 * @param {number} currentXP
 * @returns {{ currentLevel, nextLevelXP, prevLevelXP, progressPct }}
 */
function getLevelInfo(currentXP) {
  const thresholds = [0, 200, 500, 1000, 2000, 3500, 5500, 7500, 9000, 10000];
  let currentLevel = 1;
  let prevLevelXP = 0;
  let nextLevelXP = thresholds[1];

  for (let i = 0; i < thresholds.length; i++) {
    if (currentXP >= thresholds[i]) {
      currentLevel = i + 1;
      prevLevelXP = thresholds[i];
      nextLevelXP = thresholds[i + 1] || thresholds[i];
    }
  }

  currentLevel = Math.min(currentLevel, 10);
  const progressPct =
    nextLevelXP > prevLevelXP
      ? Math.round(((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100)
      : 100;

  return { currentLevel, nextLevelXP, prevLevelXP, progressPct };
}

module.exports = { calculateBMR, calculateNutritionTargets, calculateGoalPercentage, getLevelInfo };
