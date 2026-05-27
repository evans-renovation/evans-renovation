/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'evans-stone': '#F5F4F0', 
        'evans-earth': '#2A2825', 
        'evans-heritage': '#6A7B62', // Muted Sage Green
      }
    },
  },
  plugins: [],
}
