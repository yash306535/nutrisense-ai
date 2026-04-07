import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { formatCalories, getHealthScoreColor } from '../../utils/formatters';

const categoryEmoji = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

export default function MealItem({ meal, onClick }) {
  const scoreColor = getHealthScoreColor(meal.healthScore);

  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
    >
      <div className="text-2xl">{categoryEmoji[meal.mealCategory] || '🍽️'}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary text-sm truncate">{meal.name}</p>
        <p className="text-xs text-text-muted">{meal.mealCategory}</p>
      </div>
      <div className="flex items-center gap-2">
        {meal.healthScore > 0 && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${scoreColor.bg}`}>
            <span className={`font-mono font-bold text-xs ${scoreColor.text}`}>{meal.healthScore}</span>
          </div>
        )}
        <span className="font-mono font-bold text-secondary text-sm">
          {formatCalories(meal.calories)}
        </span>
        <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
}
