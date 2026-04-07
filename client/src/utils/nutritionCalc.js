/**
 * Calculate BMR using Mifflin-St Jeor equation.
 */
export function calculateBMR({ weight, height, age, gender }) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'male') return base + 5;
  if (gender === 'female') return base - 161;
  return base - 78;
}

const MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * Calculate daily calorie target from user profile.
 */
export function calculateCalorieTarget({ weight, height, age, gender, activityLevel, goalType }) {
  const bmr = calculateBMR({ weight, height, age, gender });
  const tdee = bmr * (MULTIPLIERS[activityLevel] || 1.55);

  switch (goalType) {
    case 'lose_weight': return Math.max(Math.round(tdee - 500), gender === 'female' ? 1200 : 1500);
    case 'gain_muscle': return Math.round(tdee + 300);
    default: return Math.round(tdee);
  }
}

/**
 * Calculate macro grams from calorie target and percentages.
 */
export function calculateMacros(calorieTarget, { proteinPct = 30, carbsPct = 40, fatPct = 30 } = {}) {
  return {
    protein: Math.round((calorieTarget * proteinPct) / 100 / 4),
    carbs: Math.round((calorieTarget * carbsPct) / 100 / 4),
    fat: Math.round((calorieTarget * fatPct) / 100 / 9),
  };
}

/**
 * Calculate percentage of daily goal met (0-100, capped).
 */
export function goalPct(actual, target) {
  if (!target) return 0;
  return Math.min(100, Math.round((actual / target) * 100));
}
