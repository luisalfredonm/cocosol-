/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        teal: {
          50:  '#E0F7FA',
          100: '#B2EBF2',
          200: '#80DEEA',
          400: '#26C6DA',
          500: '#00BCD4',
          600: '#0097A7',
          700: '#00838F',
          900: '#006064',
        },
        navy: { 900: '#0A1628' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
