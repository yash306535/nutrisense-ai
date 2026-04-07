import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import Navbar from './components/organisms/Navbar';
import Sidebar from './components/organisms/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import MealLog from './pages/MealLog';
import AIChat from './pages/AIChat';
import MealPlanner from './pages/MealPlanner';
import FoodScanner from './pages/FoodScanner';
import Insights from './pages/Insights';
import Goals from './pages/Goals';
import Recipes from './pages/Recipes';
import Social from './pages/Social';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

function AnimatedPage({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' },
          success: { iconTheme: { primary: '#22c55e', secondary: 'white' } },
          error: { iconTheme: { primary: '#dc2626', secondary: 'white' } },
        }}
      />

      {isAuthenticated && <Navbar />}

      <div className={`flex ${isAuthenticated ? 'min-h-[calc(100vh-64px)]' : ''}`}>
        {isAuthenticated && <Sidebar />}

        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public routes */}
              <Route path="/login" element={<PublicRoute><AnimatedPage><Login /></AnimatedPage></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><AnimatedPage><Register /></AnimatedPage></PublicRoute>} />

              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><AnimatedPage><Dashboard /></AnimatedPage></ProtectedRoute>} />
              <Route path="/log" element={<ProtectedRoute><AnimatedPage><MealLog /></AnimatedPage></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><AnimatedPage><AIChat /></AnimatedPage></ProtectedRoute>} />
              <Route path="/planner" element={<ProtectedRoute><AnimatedPage><MealPlanner /></AnimatedPage></ProtectedRoute>} />
              <Route path="/scanner" element={<ProtectedRoute><AnimatedPage><FoodScanner /></AnimatedPage></ProtectedRoute>} />
              <Route path="/insights" element={<ProtectedRoute><AnimatedPage><Insights /></AnimatedPage></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><AnimatedPage><Goals /></AnimatedPage></ProtectedRoute>} />
              <Route path="/recipes" element={<ProtectedRoute><AnimatedPage><Recipes /></AnimatedPage></ProtectedRoute>} />
              <Route path="/social" element={<ProtectedRoute><AnimatedPage><Social /></AnimatedPage></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><AnimatedPage><Profile /></AnimatedPage></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><AnimatedPage><Leaderboard /></AnimatedPage></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
