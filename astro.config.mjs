import { defineConfig } from "astro/config"; // ← quitar passthroughImageService
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://puravidasurfschool.com",
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
  output: "server",
  adapter: vercel({
    imageService: true,
    imagesConfig: {
      // Incluye tamaños pequeños para logo (80-160px) y galería (200-400px)
      // sin esto, Vercel redondea hacia arriba a su próximo device size (640+)
      sizes: [80, 96, 120, 160, 200, 400, 640, 828, 1080, 1280, 1920],
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 86400,
    },
  }),
  compressHTML: true,
  build: { inlineStylesheets: "always" },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },
  security: {
    checkOrigin: false,
  },
  // ← eliminar el bloque image: { service: passthroughImageService() }
  redirects: {
    "/sitemap.xml": {
      destination: "/sitemap-index.xml",
      status: 301,
    },
    "/surf-lessons-tamarindo": {
      destination: "/tamarindo-surf-lessons",
      status: 301,
    },
    "/7-days-surf-camp-package": {
      destination: "/7-days-surf-camp-tamarindo",
      status: 301,
    },
    "/contact": { destination: "/surf-school-near-me-tamarindo", status: 301 },
    "/about": { destination: "/best-surf-school-in-tamarindo", status: 301 },
    "/about-us": { destination: "/best-surf-school-in-tamarindo", status: 301 },
    "/book": { destination: "/book-now", status: 301 },
    "/booking": { destination: "/book-now", status: 301 },
  },
});
