import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const typeConfig = {
  positive: { border: 'border-l-success', bg: 'bg-success/5', icon: TrendingUp, iconColor: 'text-success', badge: 'bg-success/10 text-success' },
  negative: { border: 'border-l-error', bg: 'bg-error/5', icon: TrendingDown, iconColor: 'text-error', badge: 'bg-error/10 text-error' },
  neutral: { border: 'border-l-slate-300', bg: 'bg-slate-50', icon: Minus, iconColor: 'text-slate-400', badge: 'bg-slate-100 text-slate-600' },
};

export default function InsightCard({ title, description, type = 'neutral', delay = 0 }) {
  const config = typeConfig[type] || typeConfig.neutral;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`border-l-4 rounded-r-2xl p-4 ${config.border} ${config.bg}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl bg-white shadow-sm mt-0.5 ${config.iconColor}`}>
          <Icon size={16} />
        </div>
        <div>
          <h4 className="font-semibold text-text-primary text-sm mb-1">{title}</h4>
          <p className="text-text-muted text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}
