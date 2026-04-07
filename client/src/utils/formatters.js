/**
 * Format a number as a calorie string.
 */
export const formatCalories = (n) => `${Math.round(n || 0)} kcal`;

/**
 * Format macro grams.
 */
export const formatGrams = (n) => `${Math.round((n || 0) * 10) / 10}g`;

/**
 * Format a date to "Mon, Apr 7" style.
 */
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/**
 * Format a date to just day abbreviation.
 */
export const formatDayAbbr = (date) =>
  new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

/**
 * Format time to "2:30 PM".
 */
export const formatTime = (date) =>
  new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/**
 * Format relative time ("2 hours ago").
 */
export const formatRelativeTime = (date) => {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

/**
 * Get health score color class.
 */
export const getHealthScoreColor = (score) => {
  if (score >= 85) return { text: 'text-success', bg: 'bg-success/10', dot: '#16a34a' };
  if (score >= 70) return { text: 'text-warning', bg: 'bg-warning/10', dot: '#d97706' };
  return { text: 'text-error', bg: 'bg-error/10', dot: '#dc2626' };
};

/**
 * Capitalize first letter.
 */
export const capitalize = (s) => s?.charAt(0).toUpperCase() + s?.slice(1).replace('_', ' ');

/**
 * Get XP needed for next level.
 */
export const getLevelProgress = (xp) => {
  const thresholds = [0, 200, 500, 1000, 2000, 3500, 5500, 7500, 9000, 10000];
  let level = 1;
  let prev = 0;
  let next = thresholds[1];

  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) {
      level = i + 1;
      prev = thresholds[i];
      next = thresholds[i + 1] ?? thresholds[i];
    }
  }

  level = Math.min(level, 10);
  const pct = next > prev ? Math.round(((xp - prev) / (next - prev)) * 100) : 100;
  return { level, pct, next, prev, xpToNext: Math.max(0, next - xp) };
};

/**
 * Truncate text to n characters.
 */
export const truncate = (text, n = 60) =>
  text?.length > n ? `${text.slice(0, n)}...` : text;
