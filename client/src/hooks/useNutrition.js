import { useQuery } from '@tanstack/react-query';
import { mealAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { goalPct } from '../utils/nutritionCalc';

/**
 * Hook for today's nutrition data and goal progress.
 */
export function useNutrition() {
  const { user } = useAuthStore();

  const todayQuery = useQuery({
    queryKey: ['today-meals'],
    queryFn: () => mealAPI.getToday().then((r) => r.data.data),
    staleTime: 30000,
    enabled: !!user,
  });

  const weeklyQuery = useQuery({
    queryKey: ['weekly-progress'],
    queryFn: () => mealAPI.getWeeklyProgress().then((r) => r.data.data),
    staleTime: 60000,
    enabled: !!user,
  });

  const totals = todayQuery.data?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const meals = todayQuery.data?.meals || [];

  const progress = {
    caloriePct: goalPct(totals.calories, user?.calorieTarget || 2000),
    proteinPct: goalPct(totals.protein, user?.proteinTarget || 150),
    carbsPct: goalPct(totals.carbs, user?.carbsTarget || 200),
    fatPct: goalPct(totals.fat, user?.fatTarget || 65),
  };

  return {
    meals,
    totals,
    progress,
    weeklyProgress: weeklyQuery.data?.progress || [],
    isLoading: todayQuery.isLoading,
    isWeeklyLoading: weeklyQuery.isLoading,
    refetch: todayQuery.refetch,
  };
}
