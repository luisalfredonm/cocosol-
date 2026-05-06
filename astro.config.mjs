import { defineConfig } from "astro/config"; // ← quitar passthroughImageService
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://puravidasurfschool.com",
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap({ filter: (page) => !page.includes("/admin") }),
  ],
  output: "server",
  adapter: vercel({ imageService: true }), // ← imageService: true
  compressHTML: true,
  build: { inlineStylesheets: "auto" },
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
