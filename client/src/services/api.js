import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor — Attach access token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor — Handle token refresh ────────────────────────────
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Show error toast for non-401 errors
    const message = error.response?.data?.message || 'An error occurred';
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

// ── API Methods ────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  refresh: (data) => api.post('/auth/refresh', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getNotifications: (params) => api.get('/auth/notifications', { params }),
  markAllRead: () => api.patch('/auth/notifications/read-all'),
};

export const mealAPI = {
  logMeal: (data) => api.post('/meals', data),
  getToday: () => api.get('/meals/today'),
  getHistory: (params) => api.get('/meals/history', { params }),
  getWeeklyProgress: () => api.get('/meals/progress/weekly'),
  deleteMeal: (id) => api.delete(`/meals/${id}`),
};

export const aiAPI = {
  analyzeMeal: (data) => api.post('/ai/analyze-meal', data),
  chat: (data) => api.post('/ai/chat', data),
  getChatHistory: (params) => api.get('/ai/chat-history', { params }),
  clearChatHistory: () => api.delete('/ai/chat-history'),
  generateMealPlan: (data) => api.post('/ai/meal-plan', data),
  checkAllergens: (data) => api.post('/ai/check-allergens', data),
  healthifyRecipe: (data) => api.post('/ai/healthify-recipe', data),
  generateInsights: () => api.post('/ai/insights'),
  generateCaption: (data) => api.post('/ai/caption', data),
};

export const goalAPI = {
  setup: (data) => api.post('/goals/setup', data),
  update: (data) => api.put('/goals/update', data),
  getProgress: () => api.get('/goals/progress'),
};

export const recipeAPI = {
  search: (params) => api.get('/recipes/search', { params }),
  getById: (id, params) => api.get(`/recipes/${id}`, { params }),
};

export const socialAPI = {
  createPost: (data) => api.post('/social/post', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getFeed: (params) => api.get('/social/feed', { params }),
  likePost: (postId) => api.post(`/social/like/${postId}`),
  addComment: (postId, data) => api.post(`/social/comment/${postId}`, data),
  toggleFollow: (userId) => api.post(`/social/follow/${userId}`),
  getLeaderboard: (params) => api.get('/social/leaderboard', { params }),
};

export default api;
