/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        safetyBlue: '#0A84FF',
        reassuringGreen: '#34C759',
      }
    },
  },
  plugins: [],
}
