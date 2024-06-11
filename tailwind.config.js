/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily:{
        'libre-caslon': ['"Libre Caslon Text"', 'serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'neutral-field-background': '#FFFFFF',
        'neutral-text': '#000000',
        'neutral-icon': '#575757',
      },
      boxShadow: {
        'lg': '0px 4px 31.4px 16px rgba(0, 0, 0, 0.14)',
      },
      borderRadius: {
        'lg': '1rem',
      }
    },
  },
  plugins: [],
}

