import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Spinner from '../atoms/Spinner';
import NutritionBadge from '../molecules/NutritionBadge';
import MacroBar from '../molecules/MacroBar';
import { aiAPI, mealAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import useMealStore from '../../store/mealStore';
import { MEAL_CATEGORIES } from '../../utils/constants';

export default function MealLogger({ onClose }) {
  const { user } = useAuthStore();
  const { addMeal } = useMealStore();
  const qc = useQueryClient();

  const [step, setStep] = useState('input'); // input | result | allergen
  const [mealInput, setMealInput] = useState('');
  const [category, setCategory] = useState('lunch');
  const [analyzed, setAnalyzed] = useState(null);
  const [allergenResult, setAllergenResult] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: () => aiAPI.analyzeMeal({ mealInput }),
    onSuccess: async (res) => {
      const data = res.data.data;
      setAnalyzed(data);
      setStep('result');

      // Auto-check allergens if user has allergies
      if (user?.allergies?.length > 0) {
        try {
          const aRes = await aiAPI.checkAllergens({
            mealDescription: mealInput,
            allergens: user.allergies,
          });
          setAllergenResult(aRes.data.data);
        } catch {}
      }
    },
  });

  const logMutation = useMutation({
    mutationFn: () =>
      mealAPI.logMeal({
        name: analyzed.name,
        mealCategory: analyzed.meal_category || category,
        calories: analyzed.calories,
        protein: analyzed.protein_g,
        carbs: analyzed.carbs_g,
        fat: analyzed.fat_g,
        fiber: analyzed.fiber_g,
        sugar: analyzed.sugar_g,
        sodium: analyzed.sodium_mg,
        healthScore: analyzed.health_score,
        healthScoreReason: analyzed.health_score_reason,
        allergens: analyzed.allergens,
        healthierAlternatives: analyzed.healthier_alternatives,
        source: 'ai',
      }),
    onSuccess: (res) => {
      const { meal, newBadges } = res.data.data;
      addMeal(meal);
      qc.invalidateQueries({ queryKey: ['today-meals'] });
      qc.invalidateQueries({ queryKey: ['weekly-progress'] });

      if (newBadges?.length > 0) {
        newBadges.forEach((b) => toast.success(`🏆 Badge Earned: ${b.name}!`, { duration: 5000 }));
      }

      toast.success('Meal logged successfully!');
      onClose?.();
    },
  });

  const highRisk = allergenResult?.risk_level === 'high';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>Log a Meal</h2>
              <p className="text-sm text-text-muted">Let AI analyze your nutrition</p>
            </div>
            <span className="text-2xl">🤖</span>
          </div>

          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-text-primary mb-2">What did you eat?</p>
                <textarea
                  value={mealInput}
                  onChange={(e) => setMealInput(e.target.value)}
                  placeholder="e.g. 'Grilled chicken breast with brown rice and broccoli'"
                  className="w-full h-24 border-2 border-slate-200 rounded-xl p-3 text-sm focus:border-primary focus:outline-none resize-none"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary mb-2">Meal Type</p>
                <div className="flex gap-2 flex-wrap">
                  {MEAL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all
                        ${category === cat ? 'bg-primary text-white' : 'bg-slate-100 text-text-muted hover:bg-slate-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                fullWidth
                icon={Sparkles}
                onClick={() => analyzeMutation.mutate()}
                loading={analyzeMutation.isPending}
                disabled={!mealInput.trim()}
                variant="accent"
              >
                Analyze with AI
              </Button>
            </div>
          )}

          {step === 'result' && analyzed && (
            <div className="space-y-5">
              {/* Allergen warning */}
              {highRisk && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-error/10 border border-error/20 rounded-xl p-3 flex items-start gap-2"
                >
                  <AlertTriangle size={18} className="text-error mt-0.5 shrink-0" />
                  <div>
                    <p className="text-error font-semibold text-sm">Allergen Alert!</p>
                    <p className="text-xs text-error/80 mt-0.5">
                      Contains: {allergenResult.detected.join(', ')}
                    </p>
                    {allergenResult.safe_alternatives?.length > 0 && (
                      <p className="text-xs text-text-muted mt-1">
                        Try: {allergenResult.safe_alternatives[0]}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Meal header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-text-primary">{analyzed.name}</h3>
                  <p className="text-2xl font-mono font-bold text-secondary">{analyzed.calories} kcal</p>
                </div>
                <NutritionBadge score={analyzed.health_score} animated />
              </div>

              <p className="text-xs text-text-muted italic">{analyzed.health_score_reason}</p>

              {/* Macros */}
              <MacroBar
                current={{ protein: analyzed.protein_g, carbs: analyzed.carbs_g, fat: analyzed.fat_g }}
                targets={{ protein: user?.proteinTarget, carbs: user?.carbsTarget, fat: user?.fatTarget }}
              />

              {/* Allergens */}
              {analyzed.allergens?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-muted mb-1">Allergens</p>
                  <div className="flex flex-wrap gap-1">
                    {analyzed.allergens.map((a) => (
                      <span key={a} className="px-2 py-0.5 bg-warning/10 text-warning text-xs rounded-full">⚠️ {a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Healthier alternatives */}
              {analyzed.healthier_alternatives?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-muted mb-1">Healthier Alternatives</p>
                  <ul className="space-y-0.5">
                    {analyzed.healthier_alternatives.map((alt, i) => (
                      <li key={i} className="text-xs text-text-muted flex items-center gap-1">
                        <span className="text-primary">✓</span> {alt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep('input')} className="flex-1">
                  Back
                </Button>
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => logMutation.mutate()}
                  loading={logMutation.isPending}
                  className="flex-1"
                >
                  Log Meal
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
