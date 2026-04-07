import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Plus, Printer } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../atoms/Button';
import Spinner from '../atoms/Spinner';
import { aiAPI, mealAPI } from '../../services/api';
import { formatCalories } from '../../utils/formatters';

const mealTypeColors = {
  breakfast: 'bg-secondary/10 border-secondary/20 text-secondary',
  lunch: 'bg-primary/10 border-primary/20 text-primary',
  dinner: 'bg-accent/10 border-accent/20 text-accent',
  snack: 'bg-warning/10 border-warning/20 text-warning',
};

const mealTypeEmoji = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };

export default function MealPlanGrid({ plan = [], onRegenerate }) {
  const qc = useQueryClient();
  const [addingAll, setAddingAll] = useState(false);
  const [regenDay, setRegenDay] = useState(null);

  const addAllMutation = useMutation({
    mutationFn: async () => {
      setAddingAll(true);
      for (const day of plan) {
        for (const type of ['breakfast', 'lunch', 'dinner', 'snack']) {
          const meal = day[type];
          if (meal) {
            await mealAPI.logMeal({
              name: meal.name,
              mealCategory: type,
              calories: meal.calories,
              protein: 0, carbs: 0, fat: 0,
              source: 'ai',
            });
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today-meals'] });
      toast.success('All meals added to your log!');
      setAddingAll(false);
    },
    onError: () => {
      toast.error('Failed to add meals');
      setAddingAll(false);
    },
  });

  const regenMealMutation = useMutation({
    mutationFn: async ({ dayIndex, mealType }) => {
      setRegenDay(`${dayIndex}-${mealType}`);
      const dayPlan = plan[dayIndex];
      const res = await aiAPI.generateMealPlan({ days: 1, goal: 'healthy' });
      return { dayIndex, mealType, newMeal: res.data.data.plan?.[0]?.[mealType] };
    },
    onSuccess: ({ dayIndex, mealType, newMeal }) => {
      setRegenDay(null);
      if (onRegenerate) onRegenerate(dayIndex, mealType, newMeal);
      toast.success('Meal regenerated!');
    },
    onError: () => { setRegenDay(null); toast.error('Failed to regenerate meal'); },
  });

  if (!plan || plan.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>
          {plan.length}-Day Meal Plan
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={Printer} onClick={() => window.print()}>
            Print
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => addAllMutation.mutate()}
            loading={addingAll}
          >
            Add All to Log
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="grid gap-4 min-w-max" style={{ gridTemplateColumns: `repeat(${plan.length}, 220px)` }}>
          {plan.map((day, dayIdx) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIdx * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* Day header */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 border-b border-slate-100">
                <p className="font-bold text-primary text-sm" style={{ fontFamily: 'Sora' }}>Day {day.day}</p>
                <p className="font-mono text-xs text-text-muted">{formatCalories(day.total_calories)}</p>
              </div>

              <div className="p-3 space-y-2">
                {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => {
                  const meal = day[type];
                  const isRegen = regenDay === `${dayIdx}-${type}`;
                  return (
                    <div key={type} className={`rounded-xl border p-2.5 ${mealTypeColors[type]}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide">
                          {mealTypeEmoji[type]} {type}
                        </span>
                        <button
                          onClick={() => regenMealMutation.mutate({ dayIndex: dayIdx, mealType: type })}
                          className="p-0.5 hover:opacity-70 transition-opacity"
                          title="Regenerate"
                        >
                          {isRegen ? <Spinner size="sm" /> : <RefreshCw size={10} />}
                        </button>
                      </div>
                      {meal ? (
                        <>
                          <p className="text-xs font-semibold leading-snug">{meal.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-mono text-[10px] opacity-70">{meal.calories} kcal</span>
                            {meal.prep_time_min && (
                              <span className="text-[10px] opacity-70">{meal.prep_time_min}min</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs opacity-50">No meal</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
