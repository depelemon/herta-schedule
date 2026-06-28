/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Herta-inspired palette
        plum: {
          950: '#140f1f',
          900: '#1b1430',
          800: '#241a3f',
          700: '#2f2252',
          600: '#3c2c68',
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
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px -6px rgba(169, 130, 219, 0.45)',
      },
    },
  },
  plugins: [],
}
