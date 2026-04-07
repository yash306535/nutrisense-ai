const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
const colors = {
  primary: 'border-primary',
  white: 'border-white',
  secondary: 'border-secondary',
  muted: 'border-slate-400',
};

export default function Spinner({ size = 'md', color = 'primary', className = '' }) {
  return (
    <div
      className={`
        ${sizes[size]} rounded-full border-2 border-t-transparent animate-spin
        ${colors[color]} ${className}
      `}
    />
  );
}
