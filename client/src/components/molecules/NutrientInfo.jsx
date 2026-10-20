import { Beef, Wheat, Droplet, Leaf } from 'lucide-react';

const NUTRIENTS = [
  { key: 'protein_g', label: 'Protein', short: 'P', icon: Beef, color: 'text-primary bg-primary/10' },
  { key: 'carbs_g', label: 'Carbs', short: 'C', icon: Wheat, color: 'text-secondary bg-secondary/10' },
  { key: 'fat_g', label: 'Fat', short: 'F', icon: Droplet, color: 'text-warning bg-warning/10' },
  { key: 'fiber_g', label: 'Fiber', short: 'Fb', icon: Leaf, color: 'text-success bg-success/10' },
];

/** Normalise macros from either `nutrition_per_serving` or flat `*_g` fields. */
export const getNutrition = (item) => {
  const src = item?.nutrition_per_serving || item || {};
  return {
    protein_g: src.protein_g,
    carbs_g: src.carbs_g,
    fat_g: src.fat_g,
    fiber_g: src.fiber_g,
  };
};

const hasData = (n) => NUTRIENTS.some(({ key }) => typeof n[key] === 'number');

/**
 * Goal fit for a serving, based on calories and macros.
 * Returns { label, tone, tip } or null when macros are unavailable.
 */
export const getGoalFit = (calories, nutrition, goal = 'maintain') => {
  const n = nutrition;
  if (!hasData(n) || !calories) return null;
  const proteinPct = ((n.protein_g || 0) * 4 * 100) / calories;
  const fiber = n.fiber_g || 0;

  if (goal === 'lose_weight') {
    if (proteinPct >= 25 && fiber >= 5) return { label: 'Great for fat loss', tone: 'success', tip: 'High protein and fiber keep you full on fewer calories.' };
    if (proteinPct >= 20 || fiber >= 5) return { label: 'Good for fat loss', tone: 'primary', tip: 'Decent satiety. More protein or fiber would make it better.' };
    return { label: 'Low satiety', tone: 'warning', tip: 'Low in protein and fiber, so it may not keep you full.' };
  }
  if (goal === 'gain_muscle') {
    if (proteinPct >= 25 && calories >= 400) return { label: 'Great for muscle gain', tone: 'success', tip: 'Plenty of protein plus enough calories to build muscle.' };
    if (proteinPct >= 18) return { label: 'Good for muscle gain', tone: 'primary', tip: 'Solid protein. Add a carb or healthy-fat side to bulk up.' };
    return { label: 'Low protein', tone: 'warning', tip: 'Pair with a protein source to support muscle gain.' };
  }
  if (proteinPct >= 20 && fiber >= 4) return { label: 'Well balanced', tone: 'success', tip: 'Good protein and fiber for everyday eating.' };
  return { label: 'Balanced', tone: 'primary', tip: 'A reasonable all-round option.' };
};

export const GOAL_TONE = {
  success: 'bg-success/10 text-success',
  primary: 'bg-primary/10 text-primary',
  warning: 'bg-warning/10 text-warning',
};

/** Compact macro chips for cards. */
export function NutrientChips({ nutrition, className = '' }) {
  if (!hasData(nutrition)) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {NUTRIENTS.map(({ key, label, short, color }) =>
        typeof nutrition[key] === 'number' ? (
          <span key={key} title={label} className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${color}`}>
            {short} {Math.round(nutrition[key])}g
          </span>
        ) : null,
      )}
    </div>
  );
}

/** Full labelled macro grid for detail views. */
export function NutrientGrid({ nutrition }) {
  if (!hasData(nutrition)) return null;
  return (
    <div className="grid grid-cols-4 gap-2">
      {NUTRIENTS.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className={`rounded-xl p-2 text-center ${color}`}>
          <Icon size={14} className="mx-auto mb-1" />
          <p className="font-mono font-bold text-sm">{Math.round(nutrition[key] || 0)}g</p>
          <p className="text-[10px] opacity-80">{label}</p>
        </div>
      ))}
    </div>
  );
}
