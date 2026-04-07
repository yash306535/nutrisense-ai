import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Sparkles, X, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
import { recipeAPI, aiAPI } from '../services/api';
import RecipeCard from '../components/molecules/RecipeCard';
import Button from '../components/atoms/Button';
import Badge from '../components/atoms/Badge';
import Spinner from '../components/atoms/Spinner';
import { CUISINES } from '../utils/constants';

const DIET_FILTERS = ['all', 'vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free'];

export default function Recipes() {
  const [query, setQuery] = useState('');
  const [diet, setDiet] = useState('all');
  const [maxCalories, setMaxCalories] = useState(600);
  const [selected, setSelected] = useState(null);
  const [healthified, setHealthified] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['recipes', query, diet, maxCalories],
    queryFn: () => recipeAPI.search({ q: query || 'healthy', diet: diet === 'all' ? 'balanced' : diet, maxCalories }).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });

  const healthifyMutation = useMutation({
    mutationFn: (recipe) => aiAPI.healthifyRecipe({ recipe }),
    onSuccess: (res) => {
      setHealthified(res.data.data);
      toast.success('Recipe healthified!');
    },
    onError: () => toast.error('Failed to healthify recipe'),
  });

  const recipes = data?.recipes || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 lg:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>Recipe Explorer</h1>
        <p className="text-text-muted text-sm">Discover and healthify delicious recipes with AI</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 border-2 border-slate-200 rounded-xl px-3 focus-within:border-primary transition-colors">
            <Search size={16} className="text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes..."
              className="flex-1 py-2.5 text-sm outline-none bg-transparent"
              onKeyDown={(e) => e.key === 'Enter' && refetch()}
            />
          </div>
          <Button icon={Search} onClick={() => refetch()} loading={isLoading}>
            Search
          </Button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {DIET_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setDiet(f)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                diet === f ? 'bg-primary text-white' : 'bg-slate-100 text-text-muted hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
          <div className="shrink-0 flex items-center gap-2 ml-2">
            <span className="text-xs text-text-muted">Max:</span>
            <input
              type="number"
              value={maxCalories}
              onChange={(e) => setMaxCalories(Number(e.target.value))}
              className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs"
            />
            <span className="text-xs text-text-muted">kcal</span>
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-56 animate-pulse bg-slate-100 rounded-2xl" />)}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <ChefHat size={48} className="mx-auto text-text-muted mb-3" />
          <p className="font-bold text-text-primary">No recipes found</p>
          <p className="text-text-muted text-sm">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {recipes.map((recipe, i) => (
            <motion.div key={recipe.id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <RecipeCard
                recipe={recipe}
                onClick={() => { setSelected(recipe); setHealthified(null); }}
                onHealthify={() => { setSelected(recipe); healthifyMutation.mutate(recipe); }}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="font-bold text-xl text-text-primary pr-4" style={{ fontFamily: 'Sora' }}>
                    {(healthified || selected).name}
                  </h2>
                  <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {healthified?.changes_made && (
                  <div className="bg-success/10 border border-success/20 rounded-xl p-3 mb-4">
                    <p className="text-xs font-bold text-success mb-1">✓ Healthified Changes:</p>
                    <p className="text-xs text-text-muted">{healthified.changes_made}</p>
                  </div>
                )}

                <div className="flex gap-3 mb-4">
                  {[
                    { label: 'Calories', value: `${(healthified || selected).calories_per_serving} kcal` },
                    { label: 'Prep Time', value: `${(healthified || selected).prep_time_min}min` },
                    { label: 'Health Score', value: `${(healthified || selected).health_score}/100` },
                  ].map((s) => (
                    <div key={s.label} className="flex-1 text-center bg-slate-50 rounded-xl p-2">
                      <p className="font-mono font-bold text-sm text-text-primary">{s.value}</p>
                      <p className="text-xs text-text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <h3 className="font-bold text-text-primary mb-2">Ingredients</h3>
                  <ul className="space-y-1">
                    {((healthified || selected).ingredients || []).map((ing, i) => (
                      <li key={i} className="text-sm text-text-muted flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <h3 className="font-bold text-text-primary mb-2">Instructions</h3>
                  <ol className="space-y-2">
                    {((healthified || selected).steps || []).map((step, i) => (
                      <li key={i} className="text-sm text-text-muted flex gap-2">
                        <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <Button
                  fullWidth
                  variant="accent"
                  icon={Sparkles}
                  onClick={() => healthifyMutation.mutate(selected)}
                  loading={healthifyMutation.isPending}
                >
                  {healthified ? 'Re-Healthify' : 'Healthify This Recipe'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
