import { create } from 'zustand';

const useMealStore = create((set, get) => ({
  todayMeals: [],
  todayTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  weeklyProgress: [],
  lastAnalyzed: null,

  setTodayMeals: (meals, totals) => set({ todayMeals: meals, todayTotals: totals }),

  addMeal: (meal) =>
    set((state) => ({
      todayMeals: [...state.todayMeals, meal],
      todayTotals: {
        calories: state.todayTotals.calories + (meal.calories || 0),
        protein: state.todayTotals.protein + (meal.protein || 0),
        carbs: state.todayTotals.carbs + (meal.carbs || 0),
        fat: state.todayTotals.fat + (meal.fat || 0),
      },
    })),

  removeMeal: (mealId) =>
    set((state) => {
      const meal = state.todayMeals.find((m) => m._id === mealId);
      return {
        todayMeals: state.todayMeals.filter((m) => m._id !== mealId),
        todayTotals: meal
          ? {
              calories: Math.max(0, state.todayTotals.calories - meal.calories),
              protein: Math.max(0, state.todayTotals.protein - meal.protein),
              carbs: Math.max(0, state.todayTotals.carbs - meal.carbs),
              fat: Math.max(0, state.todayTotals.fat - meal.fat),
            }
          : state.todayTotals,
      };
    }),

  setWeeklyProgress: (progress) => set({ weeklyProgress: progress }),
  setLastAnalyzed: (result) => set({ lastAnalyzed: result }),
  clearLastAnalyzed: () => set({ lastAnalyzed: null }),
}));

export default useMealStore;
