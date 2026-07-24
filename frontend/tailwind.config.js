/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF7EF',
        ink: '#2B2620',
        forest: {
          DEFAULT: '#2F5233',
          light: '#3F6B44',
          dark: '#203823',
        },
        amber: {
          DEFAULT: '#C97A3D',
          light: '#E0985E',
          dark: '#A25F2C',
        },
        sage: '#DCE6D6',
        muted: '#8B8478',
        card: '#FFFDF8',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
