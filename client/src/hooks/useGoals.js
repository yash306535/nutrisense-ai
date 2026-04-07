import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { goalAPI } from '../services/api';
import useAuthStore from '../store/authStore';

/**
 * Hook for reading and updating the user's nutrition goal.
 */
export function useGoals() {
  const { updateUser } = useAuthStore();
  const qc = useQueryClient();

  const progressQuery = useQuery({
    queryKey: ['goal-progress'],
    queryFn: () => goalAPI.getProgress().then((r) => r.data.data),
    retry: false,
  });

  const setupMutation = useMutation({
    mutationFn: (data) => goalAPI.setup(data).then((r) => r.data.data),
    onSuccess: ({ goal }) => {
      updateUser({
        calorieTarget: goal.calorieTarget,
        proteinTarget: goal.proteinTarget,
        carbsTarget: goal.carbsTarget,
        fatTarget: goal.fatTarget,
        goal: goal.goalType,
      });
      qc.invalidateQueries({ queryKey: ['goal-progress'] });
      toast.success('Goal set up successfully!');
    },
    onError: () => toast.error('Failed to set up goal'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => goalAPI.update(data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goal-progress'] });
      toast.success('Goal updated!');
    },
    onError: () => toast.error('Failed to update goal'),
  });

  return {
    goal: progressQuery.data?.goal,
    progress: progressQuery.data,
    isLoading: progressQuery.isLoading,
    hasGoal: !!progressQuery.data?.goal,
    setup: setupMutation.mutate,
    update: updateMutation.mutate,
    isSettingUp: setupMutation.isPending,
  };
}
