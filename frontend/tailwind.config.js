/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#030712',
        'bg-secondary': '#0a0f1e',
        'bg-card': '#0d1424',
        'bg-elevated': '#131c2e',
        'accent-cyan': '#00d4ff',
        'accent-green': '#00ff88',
        'accent-warning': '#ffb800',
        'accent-danger': '#ff4757',
        'accent-purple': '#8b5cf6',
      },
      fontFamily: {
        'mono': ['"Space Mono"', 'monospace'],
        'heading': ['Rajdhani', 'sans-serif'],
        'body': ['"DM Sans"', 'sans-serif'],
        'data': ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'ecg-scroll': 'ecgScroll 4s linear infinite',
        'dash': 'dash 2s linear infinite',
      },
      keyframes: {
        glow: {
          'from': { boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)' },
          'to': { boxShadow: '0 0 30px rgba(0, 212, 255, 0.7), 0 0 60px rgba(0, 212, 255, 0.3)' }
        },
        ecgScroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        dash: {
          'to': { strokeDashoffset: '-20' }
        }
      }
    },
  },
  plugins: [],
}
