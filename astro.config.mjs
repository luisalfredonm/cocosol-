import { defineConfig } from "astro/config"; // ← quitar passthroughImageService
import { execSync } from "node:child_process";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import vercel from "@astrojs/vercel";

// lastmod por página = fecha del último commit de git que tocó su archivo fuente.
// Routing plano: "/" → src/pages/index.astro, "/x" → src/pages/x.astro, etc.
// Si git no tiene la fecha (clone shallow en CI), se omite lastmod en vez de inventarla.
function gitLastmod(url) {
  const path = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
  const rel = path === "" ? "index" : path;
  for (const file of [`src/pages/${rel}.astro`, `src/pages/${rel}/index.astro`]) {
    try {
      const out = execSync(`git log -1 --format=%cI -- "${file}"`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (out) return out;
    } catch {
      /* archivo no encontrado en el historial: continuar */
    }
  }
  return undefined;
}

export default defineConfig({
  site: "https://cocosolsurf.com",
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    // Phosphor via Iconify. Icons are inlined as SVG at build time, so this
    // adds zero runtime JS. One family, one stroke weight, no hand-drawn paths.
    icon({ include: { ph: ["*"] } }),
    sitemap({
      // admin is private; api are endpoints — both excluded from the sitemap
      filter: (page) => !page.includes("/admin"),
      serialize(item) {
        const lastmod = gitLastmod(item.url);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  output: "server",
  adapter: vercel({
    imageService: true,
    imagesConfig: {
      // Incluye tamaños pequeños para logo (80-160px) y galería (200-400px)
      // sin esto, Vercel redondea hacia arriba a su próximo device size (640+)
      sizes: [80, 96, 120, 160, 200, 320, 400, 480, 640, 800, 828, 1080, 1280, 1920],
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 86400,
    },
  }),
  compressHTML: true,
  // URLs sin trailing slash — coincide con los canonical de SEOHead y los links internos
  trailingSlash: "never",
  build: { inlineStylesheets: "always", format: "file" },
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
    "/about": { destination: "/best-surf-school-cocoa-beach", status: 301 },
    "/about-us": { destination: "/best-surf-school-cocoa-beach", status: 301 },
    "/book": { destination: "/book-now", status: 301 },
    "/booking": { destination: "/book-now", status: 301 },
    // Legacy URLs still indexed by Google (from SEMrush organic report) — 301 to
    // their current canonical pages to recover ranking equity instead of 404ing.
    "/surf-lessons-cocoa-beach": { destination: "/", status: 301 },
    "/book-surf-lessons-cocoa-beach": { destination: "/book-now", status: 301 },
    "/surf-packages": { destination: "/surf-packages-cocoa-beach", status: 301 },
  },
});
