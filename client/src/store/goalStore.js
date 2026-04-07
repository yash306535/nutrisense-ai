import { create } from 'zustand';

const useGoalStore = create((set) => ({
  goal: null,
  progress: null,

  setGoal: (goal) => set({ goal }),
  setProgress: (progress) => set({ progress }),
  clearGoal: () => set({ goal: null, progress: null }),
}));

export default useGoalStore;
