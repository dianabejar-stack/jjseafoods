/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        seafoods: {
          dark: '#1F7A63',
          main: '#3AAE8D',
          light: '#e8f5f1',
        }
      }
    },
  },
  plugins: [],
}
