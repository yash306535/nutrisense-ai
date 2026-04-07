import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Plus, Search, Calendar, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { mealAPI, socialAPI } from '../services/api';
import FoodCard from '../components/molecules/FoodCard';
import MealLogger from '../components/organisms/MealLogger';
import Button from '../components/atoms/Button';
import { formatDate } from '../utils/formatters';

export default function MealLog() {
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const qc = useQueryClient();

  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['today-meals'],
    queryFn: () => mealAPI.getToday().then((r) => r.data.data),
    staleTime: 30000,
  });

  const {
    data: historyPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: histLoading,
  } = useInfiniteQuery({
    queryKey: ['meal-history', dateFilter],
    queryFn: ({ pageParam }) =>
      mealAPI.getHistory({ lastId: pageParam, limit: 20, from: dateFilter || undefined }).then((r) => r.data.data),
    getNextPageParam: (last) => {
      if (!last.hasMore || !last.meals.length) return undefined;
      return last.meals[last.meals.length - 1]._id;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => mealAPI.deleteMeal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today-meals'] });
      qc.invalidateQueries({ queryKey: ['meal-history'] });
      toast.success('Meal deleted');
    },
  });

  const shareMutation = useMutation({
    mutationFn: async (meal) => {
      const formData = new FormData();
      formData.append('mealId', meal._id);
      formData.append('caption', `Just logged ${meal.name}! 🥗 #NutriSense`);
      return socialAPI.createPost(formData);
    },
    onSuccess: () => toast.success('Shared to social feed!'),
  });

  const todayMeals = todayData?.meals || [];
  const historyMeals = historyPages?.pages?.flatMap((p) => p.meals) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>Meal Log</h1>
          <p className="text-text-muted text-sm">Track every meal, every day</p>
        </div>
        <Button icon={Plus} onClick={() => setLoggerOpen(true)}>Log Meal</Button>
      </div>

      {/* Today's summary */}
      {todayData?.totals && (
        <div className="grid grid-cols-4 gap-3">
          {['calories', 'protein', 'carbs', 'fat'].map((macro) => (
            <div key={macro} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
              <p className="font-mono font-bold text-lg text-text-primary">
                {Math.round(todayData.totals[macro] || 0)}
                <span className="text-xs font-sans text-text-muted ml-0.5">{macro === 'calories' ? '' : 'g'}</span>
              </p>
              <p className="text-xs text-text-muted capitalize">{macro}</p>
            </div>
          ))}
        </div>
      )}

      {/* Today's meals */}
      <section>
        <h2 className="font-bold text-text-primary mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          Today
        </h2>
        {todayLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 animate-pulse bg-slate-100 rounded-2xl" />)}</div>
        ) : todayMeals.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-slate-100">
            <p className="text-4xl mb-2">🌅</p>
            <p className="text-text-muted text-sm">No meals logged today yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayMeals.map((meal) => (
              <div key={meal._id} className="relative">
                <FoodCard meal={meal} onDelete={(id) => deleteMutation.mutate(id)} />
                <button
                  onClick={() => shareMutation.mutate(meal)}
                  className="absolute top-3 right-12 p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Share to feed"
                >
                  <Share2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-text-primary flex items-center gap-2">
            <Search size={16} className="text-primary" />
            History
          </h2>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none"
          />
        </div>

        <div className="space-y-3">
          {histLoading
            ? [1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse bg-slate-100 rounded-2xl" />)
            : historyMeals.map((meal) => (
                <FoodCard key={meal._id} meal={meal} onDelete={(id) => deleteMutation.mutate(id)} compact />
              ))}
        </div>

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full mt-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm text-text-muted hover:border-primary hover:text-primary transition-colors"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </button>
        )}
      </section>

      <AnimatePresence>
        {loggerOpen && <MealLogger onClose={() => setLoggerOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
