/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#22c55e',
        secondary: '#f97316',
        accent: '#a855f7',
        background: '#f8fafc',
        surface: '#ffffff',
        'text-primary': '#0f172a',
        'text-muted': '#64748b',
        success: '#16a34a',
        warning: '#d97706',
        error: '#dc2626',
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        md: '12px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'card': '0 2px 16px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
