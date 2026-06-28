/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        plum: {
          950: '#110d1c',
          900: '#1b1430',
          800: '#231a3e',
          700: '#2e2250',
          600: '#3b2c66',
        },
        lilac: {
          300: '#d7c4f0',
          400: '#c3a6e8',
          500: '#a982db',
          600: '#9168c9',
        },
        lavender: {
          100: '#efe9fb',
          200: '#ddd2f2',
          300: '#c5b6e3',
        },
        teal: {
          300: '#7fe8d8',
          400: '#4dd4be',
          500: '#2bbca6',
        },
        gold: {
          300: '#f5dfa0',
          400: '#f0c868',
          500: '#e0ae40',
        },
        rose: {
          300: '#f0a8c0',
          400: '#e87898',
          500: '#d05878',
        },
        indigo: {
          400: '#9080e0',
          500: '#7060cc',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px -6px rgba(169, 130, 219, 0.45)',
        'glow-teal': '0 0 24px -6px rgba(77, 212, 190, 0.35)',
        'glow-gold': '0 0 20px -6px rgba(240, 200, 104, 0.35)',
      },
    },
  },
  plugins: [],
}
