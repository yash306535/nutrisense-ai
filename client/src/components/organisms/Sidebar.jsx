import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, UtensilsCrossed, MessageSquare, Calendar,
  ScanLine, BarChart3, Target, BookOpen, Users, User, Trophy,
} from 'lucide-react';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/log', icon: UtensilsCrossed, label: 'Meal Log' },
  { to: '/chat', icon: MessageSquare, label: 'NutriBot AI', accent: true },
  { to: '/planner', icon: Calendar, label: 'Meal Planner' },
  { to: '/scanner', icon: ScanLine, label: 'Food Scanner' },
  { to: '/insights', icon: BarChart3, label: 'Insights' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/recipes', icon: BookOpen, label: 'Recipes' },
  { to: '/social', icon: Users, label: 'Social' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const { sidebarOpen } = useUIStore();
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="desktop-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:flex flex-col h-[calc(100vh-64px)] sticky top-16 bg-white border-r border-slate-200 overflow-hidden shrink-0"
          >
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map(({ to, icon: Icon, label, accent }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group
                    ${isActive
                      ? accent
                        ? 'bg-accent/10 text-accent font-semibold'
                        : 'bg-primary/10 text-primary font-semibold'
                      : 'text-text-muted hover:bg-slate-50 hover:text-text-primary'
                    }
                  `}
                >
                  <Icon size={18} className={accent ? '' : ''} />
                  <span className="text-sm whitespace-nowrap">{label}</span>
                  {accent && (
                    <span className="ml-auto text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-3 text-center">
                <p className="text-xs text-text-muted">Powered by</p>
                <p className="text-sm font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>LLaMA3 70B</p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex justify-around items-center px-2 py-2 safe-area-pb">
        {[navItems[0], navItems[1], navItems[2], navItems[3], navItems[10]].map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `
              flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all
              ${isActive ? 'text-primary' : 'text-text-muted'}
            `}
          >
            <Icon size={20} />
            <span className="text-[9px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
