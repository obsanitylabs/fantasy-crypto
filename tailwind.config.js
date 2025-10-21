/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'fantasy-primary': '#1a73e8',
        'fantasy-secondary': '#34a853',
        'fantasy-accent': '#fbbc05',
        'fantasy-danger': '#ea4335',
        'fantasy-dark': '#202124',
        'fantasy-light': '#f8f9fa',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'searching': 'searching 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        searching: {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 1 },
        },
        glow: {
          'from': { boxShadow: '0 0 20px #fbbc05' },
          'to': { boxShadow: '0 0 30px #fbbc05, 0 0 40px #fbbc05' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hail-mary': 'linear-gradient(135deg, #1a73e8 0%, #34a853 100%)',
      },
    },
  },
  plugins: [],
};