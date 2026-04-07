const sizes = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-14 h-14 text-xl', xl: 'w-20 h-20 text-2xl' };

export default function Avatar({ src, name = '?', size = 'md', className = '' }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  // Generate a consistent color from name
  const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-blue-500', 'bg-teal-500'];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${sizes[size]} ${colors[colorIdx]} rounded-full flex items-center justify-center
        text-white font-bold ring-2 ring-white ${className}
      `}
    >
      {initial}
    </div>
  );
}
