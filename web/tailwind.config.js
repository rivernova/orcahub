/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        ui: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        orca: {
          void:     '#050508',
          deep:     '#080b12',
          surface:  '#0d1120',
          raised:   '#111827',
          elevated: '#151f32',
          cyan:     '#00d4ff',
          purple:   '#7c3aed',
          green:    '#10d98a',
          amber:    '#f59e0b',
          red:      '#ef4444',
        },
      },
      keyframes: {
        pdot: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.7', transform: 'scale(.8)' },
        },
        pagein: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
        orb: {
          '0%,100%': { boxShadow: '0 0 48px rgba(124,58,237,.12)' },
          '50%':     { boxShadow: '0 0 72px rgba(124,58,237,.22)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        pdot:       'pdot 2s ease infinite',
        pagein:     'pagein 0.28s cubic-bezier(0.4,0,0.2,1) both',
        spin:       'spin 0.7s linear infinite',
        orb:        'orb 3s ease infinite',
        'slide-in': 'slide-in 0.22s cubic-bezier(0.4,0,0.2,1) both',
        shimmer:    'shimmer 1.5s infinite',
      },
      borderRadius: {
        sm2: '7px',
        md2: '11px',
        lg2: '16px',
        xl2: '22px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
