import type { APIRoute } from "astro";

const BASE = "https://cocosolsurf.com";

interface SitemapEntry {
  loc: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
}

const TODAY = new Date().toISOString().split("T")[0];

const pages: SitemapEntry[] = [
  { loc: "/", changefreq: "weekly", priority: "1.0", lastmod: TODAY },
  { loc: "/private-surf-lessons-cocoa-beach", changefreq: "monthly", priority: "0.9" },
  { loc: "/surf-coaching-cocoa-beach", changefreq: "monthly", priority: "0.9" },
  { loc: "/group-surf-lessons-cocoa-beach", changefreq: "monthly", priority: "0.9" },
  { loc: "/surf-camp-cocoa-beach", changefreq: "monthly", priority: "0.9" },
  { loc: "/kids-surf-lessons-cocoa-beach", changefreq: "monthly", priority: "0.9" },
  { loc: "/surf-packages-cocoa-beach", changefreq: "monthly", priority: "0.9" },
  { loc: "/best-surf-school-cocoa-beach", changefreq: "monthly", priority: "0.8" },
  { loc: "/contact", changefreq: "yearly", priority: "0.6" },
  { loc: "/book-now", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog", changefreq: "weekly", priority: "0.8", lastmod: TODAY },
  { loc: "/blog/best-time-to-surf-tamarindo", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog/how-to-get-from-san-jose-to-tamarindo", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog/is-tamarindo-good-for-beginner-surfers", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog/surf-trip-costa-rica-packing-list", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog/surfing-with-kids-tamarindo", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog/tamarindo-vs-jaco-surf-beginners", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog/what-is-a-surf-camp", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog/what-to-expect-first-surf-lesson-tamarindo", changefreq: "monthly", priority: "0.7" },
  { loc: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { loc: "/terms-of-use", changefreq: "yearly", priority: "0.3" },
];

function buildUrl(entry: SitemapEntry): string {
  const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : "";
  return `  <url>
    <loc>${BASE}${entry.loc}</loc>${lastmod}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
}

export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(buildUrl).join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
};
