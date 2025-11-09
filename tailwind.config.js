/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cricket-green': '#10b981',
        'cricket-green-bright': '#34d399',
        'cricket-blue': '#3b82f6',
        'cricket-blue-bright': '#60a5fa',
        'cricket-purple': '#8b5cf6',
        'cricket-orange': '#f59e0b',
        'cricket-dark': '#1e293b',
        'cricket-darker': '#0f172a',
        'cricket-card': '#1e293b',
        'cricket-card-hover': '#334155',
        'cricket-text': '#f1f5f9',
        'cricket-text-muted': '#cbd5e1',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cricket-gradient': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        'card-gradient': 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            opacity: 1,
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
          },
          '50%': {
            opacity: 0.8,
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.8)',
          },
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(10px)',
            opacity: 0,
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: 1,
          },
        },
        'shimmer': {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
    },
  },
  plugins: [],
}

