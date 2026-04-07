import { motion } from 'framer-motion';
import { Trash2, Clock } from 'lucide-react';
import Badge from '../atoms/Badge';
import { formatCalories, formatTime, getHealthScoreColor } from '../../utils/formatters';

export default function FoodCard({ meal, onDelete, compact = false }) {
  const scoreColor = getHealthScoreColor(meal.healthScore);
  const categoryColors = {
    breakfast: 'secondary',
    lunch: 'primary',
    dinner: 'accent',
    snack: 'warning',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`
        bg-white rounded-2xl border border-slate-100 shadow-sm
        hover:shadow-md transition-shadow duration-200
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant={categoryColors[meal.mealCategory] || 'neutral'} size="sm">
              {meal.mealCategory}
            </Badge>
            {meal.healthScore > 0 && (
              <span className={`text-xs font-semibold font-mono ${scoreColor.text}`}>
                {meal.healthScore}/100
              </span>
            )}
          </div>
          <h3 className="font-semibold text-text-primary text-sm leading-tight truncate">
            {meal.name}
          </h3>
          {!compact && (
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-secondary font-bold text-sm">
                {formatCalories(meal.calories)}
              </span>
              <span className="text-xs text-text-muted">
                P: {Math.round(meal.protein || 0)}g · C: {Math.round(meal.carbs || 0)}g · F: {Math.round(meal.fat || 0)}g
              </span>
            </div>
          )}
          {compact && (
            <span className="font-mono text-secondary font-bold text-sm">
              {formatCalories(meal.calories)}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 text-text-muted text-xs">
            <Clock size={11} />
            {formatTime(meal.loggedAt)}
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(meal._id)}
              className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      {!compact && meal.allergens?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {meal.allergens.map((a) => (
            <Badge key={a} variant="error" size="sm">⚠️ {a}</Badge>
          ))}
        </div>
      )}
    </motion.div>
  );
}
