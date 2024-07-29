/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        'custom-lg': '106px',
      },
      fontFamily:{
        'helvetica': ['Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        'neutral-field-background': '#FFFFFF',
        'neutral-icon': '#575757',
        'neutral-container-bg': 'var(--Color-Neutral-container-background, #F7F7F7)',
      },
      boxShadow: {
        'lg': '0px 4px 31.4px 16px rgba(0, 0, 0, 0.14)',
      },
      borderRadius: {
        'lg': '1rem',
      },
      textAlign: {
        'left': 'left',
      }
    },
  },
  plugins: [],
}

