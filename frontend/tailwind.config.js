import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
// Palette FitQuest pilotée par variables CSS (cf. src/index.css) → thèmes débloquables.
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        // Tokens sémantiques (compatibles shadcn/ui)
        background: 'var(--bg-main)',
        card: {
          DEFAULT: 'var(--bg-card)',
          shield: 'var(--bg-shield)',
        },
        border: 'var(--border)',
        input: 'var(--border)',
        ring: 'var(--accent)',
        foreground: 'var(--text-primary)',
        muted: {
          DEFAULT: 'var(--bg-card)',
          foreground: 'var(--text-secondary)',
        },
        primary: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          foreground: '#ffffff',
        },
        xp: 'var(--xp)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        destructive: {
          DEFAULT: 'var(--danger)',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        display: ['VT323', 'Orbitron', 'Rajdhani', 'ui-sans-serif', 'system-ui'],
        body: ['VT323', 'Inter', 'ui-sans-serif', 'system-ui'],
        sans: ['VT323', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      boxShadow: {
        glow: '0 0 20px -2px var(--accent)',
        'glow-xp': '0 0 20px -2px var(--xp)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'xp-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '40%, 100%': { transform: 'translateX(600%)' },
        },
        'page-enter': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'xp-shimmer': 'xp-shimmer 3s ease-in-out infinite',
        'page-enter': 'page-enter 0.18s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
