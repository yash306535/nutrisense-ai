export const MEAL_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack'];

export const BADGE_META = {
  first_meal: { icon: '🍽️', label: 'First Meal', description: 'Logged your very first meal!' },
  seven_day_streak: { icon: '🔥', label: '7-Day Streak', description: 'Logged meals 7 days in a row!' },
  protein_champion: { icon: '💪', label: 'Protein Champion', description: 'Hit protein goal 5 days in a row!' },
  veggie_lover: { icon: '🥦', label: 'Veggie Lover', description: 'Logged vegetables 10 days!' },
  goal_crusher: { icon: '🏆', label: 'Goal Crusher', description: 'Reached your target weight!' },
  nutribot_fan: { icon: '🤖', label: 'NutriBot Fan', description: 'Sent 20 NutriBot messages!' },
  explorer: { icon: '🌍', label: 'Explorer', description: 'Tried 10 different cuisines!' },
};

export const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500, 5500, 7500, 9000, 10000];

export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { value: 'light', label: 'Light', description: 'Light exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderate', description: 'Moderate exercise 3-5 days/week' },
  { value: 'active', label: 'Active', description: 'Hard exercise 6-7 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Very hard exercise, physical job' },
];

export const GOAL_TYPES = [
  { value: 'lose_weight', label: 'Lose Weight', icon: '⚖️', description: '500 kcal deficit/day' },
  { value: 'maintain', label: 'Maintain', icon: '🎯', description: 'Stay at current weight' },
  { value: 'gain_muscle', label: 'Gain Muscle', icon: '💪', description: '300 kcal surplus/day' },
];

export const MACRO_COLORS = {
  protein: '#3b82f6',   // blue
  carbs: '#f97316',     // orange
  fat: '#a855f7',       // purple
  fiber: '#22c55e',     // green
};

export const HEALTH_SCORE_COLORS = {
  high: '#16a34a',   // ≥85
  medium: '#d97706', // 70-84
  low: '#dc2626',    // <70
};

export const CUISINES = [
  'Mediterranean', 'Asian', 'Indian', 'Mexican', 'Italian',
  'American', 'Middle Eastern', 'Thai', 'Japanese', 'Greek',
  'French', 'Chinese', 'Korean', 'Vietnamese', 'Caribbean',
];

export const QUICK_REPLIES = [
  "What should I eat for breakfast?",
  "How can I hit my protein goal?",
  "Give me a healthy snack idea",
  "What foods help with weight loss?",
  "How much water should I drink?",
  "Can you review my meals today?",
];
