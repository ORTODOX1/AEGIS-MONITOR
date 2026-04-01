import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        maritime: {
          50: '#f0f7ff',
          100: '#d6ebff',
          200: '#a8d4ff',
          300: '#6db5ff',
          400: '#3b8fef',
          500: '#1a6dd4',
          600: '#0f52a8',
          700: '#0d3f80',
          800: '#0a2d5c',
          900: '#071d3b',
          950: '#030f20',
        },
        bridge: {
          panel: '#0c1a2e',
          gauge: '#132640',
          accent: '#38bdf8',
          alarm: '#f43f5e',
          caution: '#eab308',
          safe: '#22c55e',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-alarm': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
