import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'

export default defineConfig({
  site: 'https://puravidasurfschool.com',
  integrations: [react(), tailwind({ applyBaseStyles: false }), sitemap({ filter: (page) => !page.includes('/admin') })],
  output: 'static',
  adapter: vercel(),
  compressHTML: true,
  build: { inlineStylesheets: 'auto' },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  // 301 redirects — old WordPress URLs → new Astro URLs
  redirects: {
    // Slugs diferentes entre WP y Astro (confirmados en SEMrush)
    '/surf-lessons-tamarindo':      { destination: '/tamarindo-surf-lessons',      status: 301 },
    '/surf-lessons-tamarindo/':     { destination: '/tamarindo-surf-lessons',      status: 301 },
    '/7-days-surf-camp-package':    { destination: '/7-days-surf-camp-tamarindo',  status: 301 },
    '/7-days-surf-camp-package/':   { destination: '/7-days-surf-camp-tamarindo',  status: 301 },
    // Páginas típicas de WordPress sin equivalente directo
    '/contact':                     { destination: '/surf-school-near-me-tamarindo', status: 301 },
    '/contact/':                    { destination: '/surf-school-near-me-tamarindo', status: 301 },
    '/about':                       { destination: '/best-surf-school-in-tamarindo', status: 301 },
    '/about/':                      { destination: '/best-surf-school-in-tamarindo', status: 301 },
    '/about-us':                    { destination: '/best-surf-school-in-tamarindo', status: 301 },
    '/about-us/':                   { destination: '/best-surf-school-in-tamarindo', status: 301 },
    '/book':                        { destination: '/book-now',                      status: 301 },
    '/book/':                       { destination: '/book-now',                      status: 301 },
    '/booking':                     { destination: '/book-now',                      status: 301 },
    '/booking/':                    { destination: '/book-now',                      status: 301 },
  },
})
