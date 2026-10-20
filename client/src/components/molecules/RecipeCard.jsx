import { motion } from 'framer-motion';
import { Clock, Flame, Sparkles } from 'lucide-react';
import Badge from '../atoms/Badge';
import { getHealthScoreColor } from '../../utils/formatters';
import useAuthStore from '../../store/authStore';
import { NutrientChips, getNutrition, getGoalFit, GOAL_TONE } from './NutrientInfo';

const cuisineEmojis = {
  Mediterranean: '🫒', Asian: '🍜', Indian: '🍛', Mexican: '🌮',
  Italian: '🍝', American: '🍔', Japanese: '🍱', Thai: '🍲',
};

export default function RecipeCard({ recipe, onHealthify, onClick }) {
  const scoreColor = getHealthScoreColor(recipe.health_score || 0);
  const goal = useAuthStore((st) => st.user?.goal);
  const nutrition = getNutrition(recipe);
  const fit = getGoalFit(recipe.calories_per_serving, nutrition, goal);

  return (
    <motion.div
      whileHover={{ y: -4, shadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Header with gradient */}
      <div className="h-24 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-5xl">
        {cuisineEmojis[recipe.cuisine] || '🍽️'}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-text-primary text-sm leading-tight flex-1 pr-2">
            {recipe.name}
          </h3>
          <span className={`font-mono font-bold text-sm ${scoreColor.text}`}>
            {recipe.health_score || 0}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3 text-text-muted text-xs">
          <span className="flex items-center gap-1">
            <Flame size={11} className="text-secondary" />
            <span className="font-mono">{recipe.calories_per_serving} kcal</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {recipe.prep_time_min}min
          </span>
        </div>

        <NutrientChips nutrition={nutrition} className="mb-3" />
        {fit && (
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-3 ${GOAL_TONE[fit.tone]}`}>
            {fit.label}
          </span>
        )}

        {recipe.diet_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {recipe.diet_tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="primary" size="sm">{tag}</Badge>
            ))}
          </div>
        )}

        {onHealthify && (
          <button
            onClick={(e) => { e.stopPropagation(); onHealthify(recipe); }}
            className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors"
          >
            <Sparkles size={12} />
            Healthify This
          </button>
        )}
      </div>
    </motion.div>
  );
}
