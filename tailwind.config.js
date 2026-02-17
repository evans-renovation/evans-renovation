/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // "Playfair Display" is excellent for headings (looks like Vogue/Architecture Digest)
        serif: ['"Playfair Display"', 'serif'],
        // "Lato" is clean and easy to read for body text
        sans: ['Lato', 'sans-serif'],
      },
      colors: {
        // New Premium Palette
        'evans-slate': '#1e293b', // Richer Charcoal
        'evans-amber': '#D4AF37', // "Metallic Gold" (instead of bright orange)
        'evans-cream': '#F9F7F2', // Warm white for backgrounds
      }
    },
  },
  plugins: [],
}

