import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { RefreshCw, BarChart3, Star, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import InsightCard from '../components/molecules/InsightCard';
import Button from '../components/atoms/Button';
import { useQuery } from '@tanstack/react-query';
import { mealAPI } from '../services/api';
import { WeeklyTrend } from '../components/organisms/NutritionChart';

export default function Insights() {
  const { user } = useAuthStore();
  const [insights, setInsights] = useState(null);

  const { data: weeklyData } = useQuery({
    queryKey: ['weekly-progress'],
    queryFn: () => mealAPI.getWeeklyProgress().then((r) => r.data.data),
  });

  const insightsMutation = useMutation({
    mutationFn: () => aiAPI.generateInsights(),
    onSuccess: (res) => {
      setInsights(res.data.data);
      toast.success('Insights generated!');
    },
    onError: () => toast.error('Failed to generate insights'),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>Habit Insights</h1>
          <p className="text-text-muted text-sm">AI-powered analysis of your eating patterns</p>
        </div>
        <Button
          variant="accent"
          icon={insights ? RefreshCw : BarChart3}
          onClick={() => insightsMutation.mutate()}
          loading={insightsMutation.isPending}
        >
          {insights ? 'Regenerate' : 'Generate Insights'}
        </Button>
      </div>

      {/* Weekly Chart */}
      {weeklyData?.progress?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-text-primary mb-4">7-Day Calorie Trend</h2>
          <WeeklyTrend data={weeklyData.progress} calorieTarget={user?.calorieTarget} />
        </div>
      )}

      {insightsMutation.isPending && (
        <div className="text-center py-16">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
            <BarChart3 size={48} className="text-accent mx-auto" />
          </motion.div>
          <p className="mt-4 font-semibold text-text-primary">Analyzing 30 days of data...</p>
        </div>
      )}

      {insights && !insightsMutation.isPending && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Top Insight */}
          <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl p-5 border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <Star size={18} className="text-accent" />
              <h2 className="font-bold text-text-primary">Key Insight</h2>
            </div>
            <p className="text-text-primary">{insights.top_insight}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Avg. Calories', value: insights.weekly_avg_calories, unit: 'kcal', icon: '🔥' },
              { label: 'Target', value: user?.calorieTarget || 2000, unit: 'kcal', icon: '🎯' },
              { label: 'Best Day', value: insights.best_day_of_week, icon: '⭐' },
              { label: 'Protein Score', value: `${insights.protein_consistency_score}%`, icon: '💪' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-center">
                <p className="text-xl mb-1">{stat.icon}</p>
                <p className="font-mono font-bold text-text-primary">{stat.value}{stat.unit ? ` ${stat.unit}` : ''}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Patterns */}
          <div>
            <h2 className="font-bold text-text-primary mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Patterns Found
            </h2>
            <div className="space-y-3">
              {(insights.patterns || []).map((p, i) => (
                <InsightCard key={i} title={p.title} description={p.description} type={p.type} delay={i * 0.1} />
              ))}
            </div>
          </div>

          {/* Actionable Tips */}
          <div>
            <h2 className="font-bold text-text-primary mb-3">Actionable Tips</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              {(insights.actionable_tips || []).map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm text-text-primary">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {!insights && !insightsMutation.isPending && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <span className="text-6xl">📊</span>
          <h3 className="mt-3 font-bold text-text-primary">No insights yet</h3>
          <p className="text-text-muted text-sm mt-1">Generate insights to see AI analysis of your 30-day eating habits</p>
        </div>
      )}
    </div>
  );
}
