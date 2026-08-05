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
        // Single source of truth lives in global.css :root. These just expose
        // it to utilities so `font-display` / `font-sans` cannot drift.
        sans:    ['var(--font-body)'],
        display: ['var(--font-display)'],
      },
      borderRadius: {
        // The three-step scale. Anything outside it is a bug.
        sm:     'var(--r-sm)',
        DEFAULT: 'var(--r-sm)',
        md:     'var(--r-sm)',
        lg:     'var(--r-md)',
        xl:     'var(--r-md)',
        '2xl':  'var(--r-md)',
        '3xl':  'var(--r-md)',
        full:   'var(--r-full)',
      },
    },
  },
  plugins: [],
}
