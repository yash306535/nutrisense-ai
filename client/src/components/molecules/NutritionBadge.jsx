import { motion } from 'framer-motion';
import { getHealthScoreColor } from '../../utils/formatters';

export default function NutritionBadge({ score, size = 'md', animated = false }) {
  const { text, bg } = getHealthScoreColor(score);
  const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : 'Fair';

  const sizes = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-20 h-20 text-base',
  };

  return (
    <motion.div
      className={`relative inline-flex flex-col items-center justify-center rounded-full font-bold ${bg} ${text} ${sizes[size]}`}
      animate={animated && score >= 85 ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span className="font-mono leading-none">{score}</span>
      <span className="text-[8px] font-normal leading-none mt-0.5 opacity-75">{label}</span>
      {animated && score >= 85 && (
        <motion.div
          className={`absolute inset-0 rounded-full ${bg}`}
          animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
