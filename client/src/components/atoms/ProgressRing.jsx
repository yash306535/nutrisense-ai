export default function ProgressRing({
  radius = 54,
  stroke = 8,
  progress = 0,
  color = '#22c55e',
  trackColor = '#e2e8f0',
  children,
  className = '',
}) {
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const pct = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const size = radius * 2;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg height={size} width={size} className="-rotate-90">
        {/* Track */}
        <circle
          stroke={trackColor}
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
