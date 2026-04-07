import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken });
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (email, password) => {
        const { data } = await authAPI.login({ email, password });
        const { user, accessToken, refreshToken } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
        return user;
      },

      register: async (name, email, password) => {
        const { data } = await authAPI.register({ name, email, password });
        const { user, accessToken, refreshToken } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
        return user;
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          await authAPI.logout({ refreshToken });
        } catch {}
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      refreshUser: async () => {
        const { data } = await authAPI.getMe();
        set({ user: data.data });
      },
    }),
    {
      name: 'nutrisense-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
