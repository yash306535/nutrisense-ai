import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, LogOut, User, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import Avatar from '../atoms/Avatar';
import { getLevelProgress, formatRelativeTime } from '../../utils/formatters';
import { authAPI } from '../../services/api';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar, notificationPanelOpen, setNotificationPanelOpen } = useUIStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => authAPI.getNotifications({ limit: 10 }).then((r) => r.data.data),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const markAllRead = useMutation({
    mutationFn: () => authAPI.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifData?.unreadCount || 0;
  const levelInfo = user ? getLevelProgress(user.xp || 0) : { level: 1, pct: 0, xpToNext: 200 };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-text-muted"
          >
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🥗</span>
            <span className="font-bold text-text-primary text-lg hidden sm:block" style={{ fontFamily: 'Sora, sans-serif' }}>
              Nutri<span className="text-primary">Sense</span>
            </span>
          </Link>
        </div>

        {/* Center — XP bar */}
        {user && (
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs">
            <div className="flex items-center gap-1.5 text-accent">
              <Zap size={14} />
              <span className="text-xs font-bold">Lv.{levelInfo.level}</span>
            </div>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs text-text-muted font-mono">{levelInfo.xpToNext} XP</span>
          </div>
        )}

        {/* Right */}
        {user ? (
          <div className="flex items-center gap-2">
            {/* Streak */}
            {user.streak > 0 && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-orange-50 rounded-full">
                <span className="text-sm">🔥</span>
                <span className="font-bold text-secondary text-sm font-mono">{user.streak}</span>
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotificationPanelOpen(!notificationPanelOpen); if (unreadCount > 0) markAllRead.mutate(); }}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors text-text-muted"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-error rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notificationPanelOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <h3 className="font-semibold text-text-primary">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifData?.notifications?.length === 0 && (
                        <p className="text-text-muted text-sm text-center py-6">No notifications yet</p>
                      )}
                      {notifData?.notifications?.map((n) => (
                        <div key={n._id} className={`px-4 py-3 border-b border-slate-50 ${!n.read ? 'bg-primary/5' : ''}`}>
                          <p className="text-sm text-text-primary">{n.message}</p>
                          <p className="text-xs text-text-muted mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)}>
                <Avatar src={user.avatar} name={user.name} size="sm" />
              </button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-11 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-2"
                  >
                    <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm">
                      <User size={15} /> Profile
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-error/5 text-error transition-colors text-sm">
                      <LogOut size={15} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="px-4 py-1.5 rounded-xl border-2 border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors">Login</Link>
            <Link to="/register" className="px-4 py-1.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
}
