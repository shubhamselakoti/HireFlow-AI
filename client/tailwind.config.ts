import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        clay: {
          bg: '#F5F0FF',
          card: '#FFFFFF',
          lavender: '#E8E0FF',
          peach: '#FFE8D6',
          mint: '#D6F5E8',
          sky: '#D6EEFF',
          rose: '#FFD6E0',
          yellow: '#FFF3D6',
          text: '#2D2250',
          muted: '#7B6FA0',
          border: 'rgba(255,255,255,0.8)',
          purple: '#6D4AFF',
          'purple-light': '#9F7AEA',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        clay: '24px',
        'clay-sm': '16px',
        'clay-lg': '32px',
        pill: '50px',
      },
      boxShadow: {
        clay: '0 8px 32px rgba(100, 80, 200, 0.10), 0 2px 8px rgba(100, 80, 200, 0.06), inset 0 1.5px 0 rgba(255, 255, 255, 0.95)',
        'clay-sm': '0 4px 16px rgba(100, 80, 200, 0.08), 0 1px 4px rgba(100, 80, 200, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        'clay-lg': '0 12px 48px rgba(100, 80, 200, 0.14), 0 4px 16px rgba(100, 80, 200, 0.08), inset 0 2px 0 rgba(255, 255, 255, 0.95)',
        'clay-btn': '0 4px 14px rgba(100, 80, 200, 0.25)',
        'clay-input': 'inset 0 2px 6px rgba(0, 0, 0, 0.06)',
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
