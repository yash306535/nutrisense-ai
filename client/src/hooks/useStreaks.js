import { useMemo } from 'react';
import useAuthStore from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { mealAPI } from '../services/api';

/**
 * Hook for streak data and milestone detection.
 */
export function useStreaks() {
  const { user } = useAuthStore();
  const streak = user?.streak || 0;
  const longestStreak = user?.longestStreak || 0;

  const { data: weeklyData } = useQuery({
    queryKey: ['weekly-progress'],
    queryFn: () => mealAPI.getWeeklyProgress().then((r) => r.data.data),
    staleTime: 60000,
    enabled: !!user,
  });

  const loggedDaysThisWeek = useMemo(() => {
    return (weeklyData?.progress || []).filter((d) => d.mealCount > 0).length;
  }, [weeklyData]);

  const streakMilestone = useMemo(() => {
    if (streak === 7) return '7-day streak! 🔥';
    if (streak === 14) return '2 weeks strong! 💪';
    if (streak === 30) return '30-day champion! 🏆';
    if (streak === 100) return 'Century club! 🎖️';
    return null;
  }, [streak]);

  const isStreakAtRisk = streak > 0 && loggedDaysThisWeek === 0;

  return {
    streak,
    longestStreak,
    loggedDaysThisWeek,
    streakMilestone,
    isStreakAtRisk,
  };
}
