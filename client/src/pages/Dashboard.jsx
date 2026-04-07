import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Plus, Flame, Zap, TrendingUp } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { mealAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useMealStore from '../store/mealStore';
import { CalorieRing, MacroPie, WeeklyTrend } from '../components/organisms/NutritionChart';
import FoodCard from '../components/molecules/FoodCard';
import MacroBar from '../components/molecules/MacroBar';
import MealLogger from '../components/organisms/MealLogger';
import { getLevelProgress, formatCalories } from '../utils/formatters';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function SkeletonCard() {
  return <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse h-48" />;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { setTodayMeals, removeMeal } = useMealStore();
  const [loggerOpen, setLoggerOpen] = useState(false);
  const qc = useQueryClient();

  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['today-meals'],
    queryFn: () => mealAPI.getToday().then((r) => r.data.data),
    onSuccess: (d) => setTodayMeals(d.meals, d.totals),
    staleTime: 30000,
  });

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ['weekly-progress'],
    queryFn: () => mealAPI.getWeeklyProgress().then((r) => r.data.data),
    staleTime: 60000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => mealAPI.deleteMeal(id),
    onSuccess: (_, id) => {
      removeMeal(id);
      qc.invalidateQueries({ queryKey: ['today-meals'] });
      toast.success('Meal removed');
    },
  });

  const meals = todayData?.meals || [];
  const totals = todayData?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const weeklyProgress = weeklyData?.progress || [];
  const levelInfo = getLevelProgress(user?.xp || 0);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto px-4 py-6 pb-24 lg:pb-6 space-y-6"
    >
      {/* Welcome */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-text-muted text-sm mt-0.5">Here's your nutrition overview for today</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-2xl">
          <span className="text-xl">🔥</span>
          <div>
            <p className="font-bold text-secondary font-mono">{user?.streak || 0}</p>
            <p className="text-xs text-text-muted">day streak</p>
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calorie Ring + Macros */}
        <motion.div variants={item} className="lg:col-span-1 space-y-4">
          {/* Calorie Card */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-text-primary">Today's Calories</h2>
                <p className="text-xs text-text-muted">Target: {formatCalories(user?.calorieTarget || 2000)}</p>
              </div>
              <Flame className="text-secondary" size={20} />
            </div>
            {todayLoading ? (
              <div className="h-44 animate-pulse bg-slate-100 rounded-xl" />
            ) : (
              <CalorieRing eaten={Math.round(totals.calories)} target={user?.calorieTarget || 2000} />
            )}
          </div>

          {/* XP Progress */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-accent" />
                <span className="font-semibold text-text-primary text-sm">Level {levelInfo.level}</span>
              </div>
              <span className="text-xs text-text-muted font-mono">{user?.xp || 0} XP</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">{levelInfo.xpToNext} XP to Level {levelInfo.level + 1}</p>
          </div>
        </motion.div>

        {/* Macro Split + Bar */}
        <motion.div variants={item} className="lg:col-span-2 space-y-4">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-text-primary">Macro Split</h2>
              <TrendingUp size={18} className="text-text-muted" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {todayLoading ? (
                <>
                  <div className="h-40 animate-pulse bg-slate-100 rounded-xl" />
                  <div className="h-40 animate-pulse bg-slate-100 rounded-xl" />
                </>
              ) : (
                <>
                  <MacroPie protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
                  <MacroBar
                    current={totals}
                    targets={{ protein: user?.proteinTarget, carbs: user?.carbsTarget, fat: user?.fatTarget }}
                  />
                </>
              )}
            </div>
          </div>

          {/* 7-Day Trend */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm p-5">
            <h2 className="font-bold text-text-primary mb-4">7-Day Trend</h2>
            {weeklyLoading ? (
              <div className="h-48 animate-pulse bg-slate-100 rounded-xl" />
            ) : (
              <WeeklyTrend data={weeklyProgress} calorieTarget={user?.calorieTarget} />
            )}
          </div>
        </motion.div>
      </div>

      {/* Today's Meals */}
      <motion.div variants={item} className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-text-primary">Today's Meals ({meals.length})</h2>
          <button
            onClick={() => setLoggerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} /> Add Meal
          </button>
        </div>

        {todayLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse bg-slate-100 rounded-xl" />)}
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl">🍽️</span>
            <p className="mt-3 font-semibold text-text-primary">No meals logged yet</p>
            <p className="text-text-muted text-sm mb-4">Start tracking your nutrition today!</p>
            <button
              onClick={() => setLoggerOpen(true)}
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Log Your First Meal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => (
              <FoodCard key={meal._id} meal={meal} onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </div>
        )}
      </motion.div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setLoggerOpen(true)}
        className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 w-14 h-14 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-white z-30"
      >
        <Plus size={24} />
      </motion.button>

      <AnimatePresence>
        {loggerOpen && <MealLogger onClose={() => setLoggerOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
