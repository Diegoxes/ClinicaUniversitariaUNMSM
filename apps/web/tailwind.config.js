/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pearl: {
          DEFAULT: '#F7F5F2',
          50: '#FEFDFB',
          100: '#F7F5F2',
          200: '#EDEAE5',
          300: '#E0DCD6',
          400: '#CFC9C0',
        },
        // "marcos" evita conflicto con el breakpoint sm: de Tailwind
        marcos: {
          red: '#841937',
          'red-dark': '#5C1026',
          'red-light': '#FAEFF2',
          'red-muted': '#E8D2D8',
          gold: '#C9A227',
          'gold-light': '#F5EDD6',
          'gold-dark': '#9A7B1A',
        },
        ink: {
          DEFAULT: '#2A2224',
          muted: '#6E6366',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};
