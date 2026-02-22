/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brandDark: '#18181b',   // Deep Obsidian (Zinc 900)
        brandAccent: '#27272a', // Lighter Charcoal (Zinc 800)
        brandMuted: '#f4f4f5',  // Premium Light Gray (Zinc 100)
        brandGold: '#cda434',   // Sophisticated Muted Gold
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(0,0,0,0.08)',
        'floating': '0 -10px 40px rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
}
