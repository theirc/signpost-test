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
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '4rem',
      },
      fontWeight: {
        hairline: '100',
        thin: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
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
      },
    },
  },
  plugins: [],
}

