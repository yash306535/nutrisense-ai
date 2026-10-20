import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { aiAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import MealPlanGrid from '../components/organisms/MealPlanGrid';
import AILoadingExperience from '../components/molecules/AILoadingExperience';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import { CUISINES } from '../utils/constants';

export default function MealPlanner() {
  const { user } = useAuthStore();
  const [plan, setPlan] = useState([]);
  const [form, setForm] = useState({
    days: 7,
    cuisine: 'Mediterranean',
    restrictions: user?.dietaryRestrictions || [],
  });

  const [customRestriction, setCustomRestriction] = useState('');

  const generateMutation = useMutation({
    mutationFn: () =>
      aiAPI.generateMealPlan({
        days: Number(form.days),
        cuisine: form.cuisine,
        restrictions: form.restrictions,
        calorieTarget: user?.calorieTarget,
        goal: user?.goal,
      }),
    onSuccess: (res) => {
      const planData = res.data.data.plan;
      setPlan(Array.isArray(planData) ? planData : []);
      toast.success('Meal plan generated!');
    },
    onError: () => toast.error('Failed to generate plan. Please try again.'),
  });

  const handleRegenMeal = (dayIndex, mealType, newMeal) => {
    if (!newMeal) return;
    setPlan((prev) =>
      prev.map((day, idx) => (idx === dayIndex ? { ...day, [mealType]: newMeal } : day)),
    );
  };

  const toggleRestriction = (r) => {
    setForm((f) => ({
      ...f,
      restrictions: f.restrictions.includes(r) ? f.restrictions.filter((x) => x !== r) : [...f.restrictions, r],
    }));
  };

  const COMMON_RESTRICTIONS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'keto', 'paleo'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 lg:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>Meal Planner</h1>
        <p className="text-text-muted text-sm">AI-powered personalized meal plans</p>
      </div>

      {/* Config card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-text-primary mb-4">Configure Your Plan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-text-primary block mb-2">Number of Days</label>
            <div className="flex gap-2">
              {[3, 5, 7, 14].map((d) => (
                <button
                  key={d}
                  onClick={() => setForm((f) => ({ ...f, days: d }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                    form.days === d ? 'bg-primary text-white border-primary' : 'border-slate-200 text-text-muted hover:border-primary/50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-2">Cuisine Style</label>
            <select
              value={form.cuisine}
              onChange={(e) => setForm((f) => ({ ...f, cuisine: e.target.value }))}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none"
            >
              {CUISINES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary block mb-2">Dietary Restrictions</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {COMMON_RESTRICTIONS.map((r) => (
              <button
                key={r}
                onClick={() => toggleRestriction(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  form.restrictions.includes(r) ? 'bg-primary text-white' : 'bg-slate-100 text-text-muted hover:bg-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <Button
          fullWidth
          icon={Sparkles}
          variant="accent"
          onClick={() => generateMutation.mutate()}
          loading={generateMutation.isPending}
          className="mt-2"
        >
          {generateMutation.isPending ? 'Generating plan...' : 'Generate Meal Plan'}
        </Button>
      </div>

      {/* Generated plan */}
      {generateMutation.isPending && (
        <AILoadingExperience expectedSeconds={50} cards={4} />
      )}

      {plan.length > 0 && !generateMutation.isPending && (
        <MealPlanGrid plan={plan} onRegenerate={handleRegenMeal} />
      )}

      {plan.length === 0 && !generateMutation.isPending && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <span className="text-6xl">📅</span>
          <h3 className="mt-3 font-bold text-text-primary">No plan yet</h3>
          <p className="text-text-muted text-sm">Configure your preferences above and generate a meal plan</p>
        </div>
      )}
    </div>
  );
}
