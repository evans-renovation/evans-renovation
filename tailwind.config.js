/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
      colors: {
        // Custom branding colors
        'evans-slate': '#0f172a',
        'evans-amber': '#f59e0b',
      }
    },
  },
  plugins: [],
}

