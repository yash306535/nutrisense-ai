import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Target, TrendingDown, Scale, CheckCircle } from 'lucide-react';
import { goalAPI } from '../services/api';
import GoalSetupWizard from '../components/organisms/GoalSetupWizard';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { formatCalories, formatGrams } from '../utils/formatters';
import { BADGE_META } from '../utils/constants';

export default function Goals() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: progressData, isLoading } = useQuery({
    queryKey: ['goal-progress'],
    queryFn: () => goalAPI.getProgress().then((r) => r.data.data),
    retry: false,
  });

  const hasGoal = progressData?.goal;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse bg-slate-100 rounded-2xl" />)}
      </div>
    );
  }

  if (!hasGoal) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 pb-24 lg:pb-6">
        <GoalSetupWizard onComplete={() => navigate('/') } />
      </div>
    );
  }

  const { goal, weightLost, weightToGo, progressPct } = progressData;

  const goalLabel = { lose_weight: 'Lose Weight', maintain: 'Maintain', gain_muscle: 'Gain Muscle' };
  const goalIcon = { lose_weight: '⚖️', maintain: '🎯', gain_muscle: '💪' };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>Your Goals</h1>
        <p className="text-text-muted text-sm">Track your progress toward your target</p>
      </div>

      {/* Goal overview */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-text-muted">Current Goal</p>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <span>{goalIcon[goal.goalType]}</span>
              {goalLabel[goal.goalType]}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-muted">Progress</p>
            <p className="text-3xl font-mono font-black text-primary">{progressPct}%</p>
          </div>
        </div>
        <div className="h-3 bg-white/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-text-muted">
          <span>Start: {goal.currentWeight}kg</span>
          <span>Target: {goal.targetWeight}kg</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Daily Calories', value: formatCalories(goal.calorieTarget), icon: '🔥' },
          { label: 'Protein Target', value: formatGrams(goal.proteinTarget), icon: '💪' },
          { label: 'Carbs Target', value: formatGrams(goal.carbsTarget), icon: '🌾' },
          { label: 'Fat Target', value: formatGrams(goal.fatTarget), icon: '🥑' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="font-mono font-bold text-text-primary">{s.value}</p>
            <p className="text-xs text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Body Stats */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-bold text-text-primary mb-4">Body Stats</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Height', value: `${goal.height}cm` },
            { label: 'Current Weight', value: `${goal.currentWeight}kg` },
            { label: 'Target Weight', value: `${goal.targetWeight}kg` },
            { label: 'BMR', value: `${goal.bmr} kcal` },
            { label: 'TDEE', value: `${goal.tdee} kcal` },
            { label: 'Weight to Go', value: `${Math.abs(weightToGo).toFixed(1)}kg` },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xs text-text-muted">{s.label}</p>
              <p className="font-mono font-bold text-text-primary">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Tips */}
      {goal.weeklyTips?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
            <Target size={16} className="text-primary" />
            Your Weekly Tips
          </h2>
          <div className="space-y-3">
            {goal.weeklyTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle size={16} className="text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-text-primary">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
