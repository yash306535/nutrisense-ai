import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { aiAPI } from '../services/api';

/**
 * Hook for AI meal analysis.
 */
export function useAnalyzeMeal(onSuccess) {
  return useMutation({
    mutationFn: (mealInput) => aiAPI.analyzeMeal({ mealInput }).then((r) => r.data.data),
    onSuccess,
    onError: () => toast.error('Analysis failed. Please check your connection.'),
  });
}

/**
 * Hook for AI chat.
 */
export function useChat(onSuccess) {
  return useMutation({
    mutationFn: (message) => aiAPI.chat({ message }).then((r) => r.data.data),
    onSuccess,
    onError: () => toast.error('Chat failed. Please try again.'),
  });
}

/**
 * Hook for meal plan generation.
 */
export function useMealPlan(onSuccess) {
  return useMutation({
    mutationFn: (params) => aiAPI.generateMealPlan(params).then((r) => r.data.data),
    onSuccess,
    onError: () => toast.error('Failed to generate meal plan.'),
  });
}

/**
 * Hook for allergen check.
 */
export function useAllergenCheck(onSuccess) {
  return useMutation({
    mutationFn: (params) => aiAPI.checkAllergens(params).then((r) => r.data.data),
    onSuccess,
  });
}

/**
 * Hook for insights generation.
 */
export function useInsights(onSuccess) {
  return useMutation({
    mutationFn: () => aiAPI.generateInsights().then((r) => r.data.data),
    onSuccess,
    onError: () => toast.error('Failed to generate insights.'),
  });
}
