import { create } from 'zustand';

const useUIStore = create((set) => ({
  sidebarOpen: true,
  mealLoggerOpen: false,
  notificationPanelOpen: false,
  newBadges: [],
  unreadNotifications: 0,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setMealLoggerOpen: (open) => set({ mealLoggerOpen: open }),
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
  addNewBadge: (badge) => set((s) => ({ newBadges: [...s.newBadges, badge] })),
  clearNewBadges: () => set({ newBadges: [] }),
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  incrementUnread: () => set((s) => ({ unreadNotifications: s.unreadNotifications + 1 })),
}));

export default useUIStore;
