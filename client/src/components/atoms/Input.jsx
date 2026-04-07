import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  icon: Icon = null,
  className = '',
  required = false,
  disabled = false,
  name,
  min,
  max,
  step,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const hasValue = value !== undefined && value !== '';
  const floatLabel = focused || hasValue;

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          relative flex items-center rounded-xl border-2 transition-all duration-200 bg-white
          ${error ? 'border-error' : focused ? 'border-primary' : 'border-slate-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {Icon && (
          <div className="pl-3 text-text-muted">
            <Icon size={16} />
          </div>
        )}
        <div className="flex-1 relative">
          {label && (
            <label
              className={`
                absolute left-3 transition-all duration-200 pointer-events-none
                ${floatLabel ? 'top-1 text-xs font-medium text-primary' : 'top-1/2 -translate-y-1/2 text-sm text-text-muted'}
              `}
            >
              {label}
              {required && <span className="text-error ml-0.5">*</span>}
            </label>
          )}
          <input
            name={name}
            type={inputType}
            value={value}
            onChange={onChange}
            placeholder={floatLabel ? placeholder : label ? '' : placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`
              w-full bg-transparent outline-none text-text-primary
              ${label ? 'pt-4 pb-1.5 px-3 text-sm' : 'py-2.5 px-3 text-sm'}
            `}
          />
        </div>
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="pr-3 text-text-muted hover:text-text-primary transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
