import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const ORBIT_INNER = ['🥑', '🍓', '🥦', '🍋', '🥕'];
const ORBIT_OUTER = ['🍗', '🥚', '🍚', '🐟', '🥜', '🍅', '🧀'];
const RISERS = ['🌿', '🍎', '🥬', '🫐', '🌽', '🍊', '🥒', '🫘', '🍇', '🥝'];

const FACTS = [
  'Protein keeps you full longer than carbs or fat, which is why it helps with fat loss.',
  'Fiber slows digestion, steadies blood sugar and keeps hunger away.',
  'Your body burns about 20-30% of protein calories just digesting it.',
  'Eating the rainbow gives you a wider range of vitamins and antioxidants.',
  'Muscle grows when you recover, so sleep and protein both matter.',
  'Healthy fats from nuts, olive oil and fish help absorb vitamins A, D, E and K.',
  'Drinking water before meals can help you eat a little less.',
  'Whole grains have more fiber and keep energy steady compared with refined ones.',
];

const DEFAULT_STAGES = [
  { icon: '🧠', text: 'Understanding your goals' },
  { icon: '🔍', text: 'Picking ingredients that fit' },
  { icon: '⚖️', text: 'Balancing protein, carbs, fat and fiber' },
  { icon: '👨‍🍳', text: 'Writing the final menu' },
  { icon: '✨', text: 'Polishing the details' },
];

function Orbit({ items, radius, duration, reverse, size = 'text-2xl', reduced }) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ width: 0, height: 0 }}
      animate={reduced ? undefined : { rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      {items.map((e, i) => {
        const angle = (i / items.length) * Math.PI * 2;
        return (
          <motion.span
            key={e}
            className={`absolute ${size} drop-shadow-lg select-none`}
            style={{ left: Math.cos(angle) * radius - 14, top: Math.sin(angle) * radius - 16 }}
            animate={reduced ? undefined : { rotate: reverse ? 360 : -360, scale: [1, 1.25, 1] }}
            transition={{
              rotate: { duration, repeat: Infinity, ease: 'linear' },
              scale: { duration: 2.4, repeat: Infinity, delay: i * 0.35 },
            }}
          >
            {e}
          </motion.span>
        );
      })}
    </motion.div>
  );
}

/**
 * Full-width animated loading state for slow AI generations.
 * Progress is time-based: it eases towards 95% and never claims completion
 * until the parent unmounts it.
 */
export default function AILoadingExperience({
  title = 'Crafting your meal plan',
  subtitle = 'Our AI nutritionist is working on it. This can take up to a minute.',
  stages = DEFAULT_STAGES,
  expectedSeconds = 45,
  cards = 0,
}) {
  const reduced = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const [factIdx, setFactIdx] = useState(() => Math.floor(Math.random() * FACTS.length));

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 0.25), 250);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setFactIdx((i) => (i + 1) % FACTS.length), 6000);
    return () => clearInterval(t);
  }, []);

  // Ease towards 95%: fast at first, slows as it nears the expected duration.
  const progress = Math.min(95, 95 * (1 - Math.exp((-3 * elapsed) / expectedSeconds)));
  const stageIdx = Math.min(stages.length - 1, Math.floor((progress / 95) * stages.length));

  const risers = useMemo(
    () =>
      RISERS.map((e, i) => ({
        e,
        left: `${6 + ((i * 9.3) % 88)}%`,
        delay: (i * 0.9) % 6,
        duration: 7 + ((i * 1.7) % 5),
        size: 18 + ((i * 7) % 16),
      })),
    [],
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white shadow-2xl"
    >
      {/* Aurora glows */}
      <motion.div
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
        animate={reduced ? undefined : { x: [0, 60, 0], y: [0, 40, 0], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-accent/30 blur-3xl"
        animate={reduced ? undefined : { x: [0, -50, 0], y: [0, -30, 0], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-secondary/20 blur-3xl"
        animate={reduced ? undefined : { scale: [1, 1.4, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Rising ingredients */}
      {!reduced &&
        risers.map((r) => (
          <motion.span
            key={r.e}
            className="pointer-events-none absolute bottom-0 select-none opacity-0"
            style={{ left: r.left, fontSize: r.size }}
            animate={{ y: [0, -420], opacity: [0, 0.55, 0], rotate: [0, 40, -20] }}
            transition={{ duration: r.duration, delay: r.delay, repeat: Infinity, ease: 'easeOut' }}
          >
            {r.e}
          </motion.span>
        ))}

      <div className="relative z-10 px-6 py-10 sm:py-12">
        {/* Orbit scene */}
        <div className="relative mx-auto mb-8 h-72 w-72 sm:h-80 sm:w-80">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 rounded-full border border-primary/40"
              style={{ width: 90, height: 90, x: '-50%', y: '-50%' }}
              animate={reduced ? undefined : { scale: [1, 3.4], opacity: [0.7, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, delay: i * 1.2, ease: 'easeOut' }}
            />
          ))}
          <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/10 hidden sm:block" />

          <Orbit items={ORBIT_INNER} radius={78} duration={14} reduced={reduced} />
          <Orbit items={ORBIT_OUTER} radius={124} duration={22} reverse reduced={reduced} size="text-xl" />

          {/* Plate */}
          <motion.div
            className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-white to-slate-200 shadow-[0_0_60px_rgba(34,197,94,0.55)]"
            animate={reduced ? undefined : { scale: [1, 1.07, 1], rotate: [0, 4, -4, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-slate-300/70 bg-white text-4xl">
              <AnimatePresence mode="wait">
                <motion.span
                  key={stages[stageIdx].icon}
                  initial={{ scale: 0, rotate: -90, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: 90, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                >
                  {stages[stageIdx].icon}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Title */}
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-xl font-bold sm:text-2xl" style={{ fontFamily: 'Sora' }}>
            <span className="bg-gradient-to-r from-primary via-emerald-300 to-accent bg-clip-text text-transparent">
              {title}
            </span>
          </h2>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>

          {/* Current stage */}
          <div className="mt-5 h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={stageIdx}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                className="text-sm font-semibold text-emerald-300"
              >
                {stages[stageIdx].text}
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  ...
                </motion.span>
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="relative h-full rounded-full bg-gradient-to-r from-primary via-emerald-300 to-accent"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.4 }}
            >
              {!reduced && (
                <motion.div
                  className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                  animate={{ x: ['-100%', '600%'] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </motion.div>
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[11px] text-slate-500">
            <span>{Math.round(progress)}%</span>
            <span>{Math.floor(elapsed)}s</span>
          </div>

          {/* Stage dots */}
          <div className="mt-4 flex justify-center gap-2">
            {stages.map((s, i) => (
              <motion.div
                key={s.text}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                  i <= stageIdx ? 'bg-primary/25 ring-1 ring-primary/60' : 'bg-white/5 grayscale opacity-50'
                }`}
                animate={i === stageIdx && !reduced ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                transition={{ duration: 1.4, repeat: i === stageIdx ? Infinity : 0 }}
                title={s.text}
              >
                {i < stageIdx ? '✓' : s.icon}
              </motion.div>
            ))}
          </div>

          {/* Did you know */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Did you know?</p>
            <div className="relative mt-1 min-h-[3rem]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={factIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="text-sm leading-relaxed text-slate-200"
                >
                  {FACTS[factIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Skeleton cards that shimmer while waiting */}
        {cards > 0 && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: cards }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="mb-3 h-16 rounded-xl bg-white/10" />
                <div className="mb-2 h-3 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-white/10" />
                {!reduced && (
                  <motion.div
                    className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-150%', '500%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.2, ease: 'linear' }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
