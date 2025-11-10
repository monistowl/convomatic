/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{svelte,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#38bdf8'
        }
      }
    }
  },
  plugins: []
};
