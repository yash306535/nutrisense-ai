import { motion } from 'framer-motion';
import Spinner from './Spinner';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/30',
  secondary: 'bg-secondary text-white hover:bg-secondary/90 shadow-sm shadow-secondary/30',
  accent: 'bg-accent text-white hover:bg-accent/90 shadow-sm shadow-accent/30',
  outline: 'border-2 border-primary text-primary hover:bg-primary/10',
  ghost: 'text-text-primary hover:bg-slate-100',
  danger: 'bg-error text-white hover:bg-error/90',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon = null,
  onClick,
  type = 'button',
  className = '',
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-medium
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <Spinner size="sm" color={variant === 'outline' ? 'primary' : 'white'} />
      ) : (
        Icon && <Icon size={16} />
      )}
      {children}
    </motion.button>
  );
}
