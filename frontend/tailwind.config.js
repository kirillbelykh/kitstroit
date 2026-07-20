/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#121311',
        bone: '#e8e3d7',
        brass: '#b99b68',
      },
    },
  },
  plugins: [],
}
