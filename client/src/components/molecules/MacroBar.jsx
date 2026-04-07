import { motion } from 'framer-motion';

const macros = [
  { key: 'protein', label: 'Protein', color: '#3b82f6', unit: 'g' },
  { key: 'carbs', label: 'Carbs', color: '#f97316', unit: 'g' },
  { key: 'fat', label: 'Fat', color: '#a855f7', unit: 'g' },
];

export default function MacroBar({ current = {}, targets = {} }) {
  return (
    <div className="space-y-3">
      {macros.map(({ key, label, color }) => {
        const curr = Math.round(current[key] || 0);
        const target = Math.round(targets[key] || 0);
        const pct = target > 0 ? Math.min(100, (curr / target) * 100) : 0;
        const over = curr > target && target > 0;

        return (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-sm font-medium text-text-primary">{label}</span>
              </div>
              <div className="text-right">
                <span className={`font-mono text-sm font-bold ${over ? 'text-error' : 'text-text-primary'}`}>
                  {curr}g
                </span>
                {target > 0 && (
                  <span className="text-text-muted font-mono text-xs ml-1">/ {target}g</span>
                )}
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: over ? '#dc2626' : color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
