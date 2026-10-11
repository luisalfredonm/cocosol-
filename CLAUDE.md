# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Cocosol Surf Lessons — Proyecto

## Qué es
Sitio web + sistema de reservas para **Cocosol Surf Lessons**, escuela de surf en **Cocoa Beach / Cape Canaveral, Florida (USA)**. Los clientes exploran servicios, reservan lecciones y pagan; el administrador gestiona todo desde `/admin`.

- **Sitio:** https://cocosolsurf.com
- **Stack:** Astro 5 (SSR, `output: "server"`) + React 18 (solo el wizard de reservas) + Tailwind CSS 3 + TypeScript
- **Backend:** Supabase (PostgreSQL) · **Hosting:** Vercel (`@astrojs/vercel`) · **Email:** Resend
- **Fundador:** Victor Nuñez, costarricense; las menciones a Costa Rica en `/best-surf-school-cocoa-beach` y `/instructors/victor-nunez` son contenido legítimo (biografía y viajes privados), no restos de otro proyecto.

## Prioridades
1. **SEO local en inglés** (mercado: turistas y familias en Florida central/este, incluida Orlando). Una intención de keyword por ruta para evitar canibalización (ver comentario al inicio de `src/lib/seo.ts`).
2. **Conversión:** cada página empuja a `/book-now`.
3. **Performance:** Core Web Vitals en verde; JS solo donde haga falta.

## Comandos
Desde la raíz del repo:

```bash
npm run dev      # localhost:4321
npm run build    # build para Vercel
npm run preview
npm run astro    # CLI de Astro (astro check, astro sync)
```

No hay linter ni tests. La verificación es `npm run build` + `npm run astro check`.

## Estructura

```
src/
├── pages/
│   ├── index.astro                      Home (keyword: surf lessons cocoa beach)
│   ├── best-surf-school-cocoa-beach, private-/group-/kids-surf-lessons-cocoa-beach,
│   │   surf-camp-/surf-coaching-/surf-packages-/surf-training-schedule-cocoa-beach,
│   │   surf-lessons-near-orlando       Landing pages por servicio
│   ├── blog.astro + blog/*              Blog (long-tail: Cocoa Beach, cohetes, Orlando)
│   ├── instructors/victor-nunez.astro
│   ├── book-now.astro                   Monta el wizard React
│   ├── contact, privacy-policy, terms-of-use (estas dos son noindex)
│   ├── admin.astro                      Dashboard privado (ADMIN_PASSWORD)
│   └── api/
│       ├── availability.ts, class-types.ts, payment-config.ts
│       ├── contact.ts, contact-token.ts   Formulario con token anti-spam
│       ├── bookings/ create, confirm-onsite, capture-paypal, checkout-square, capture-square
│       ├── camp/ book, sessions           Reservas de camp (sesiones/habitaciones)
│       └── admin/ bookings, booking-settings, payment-config
├── components/
│   ├── booking/   BookingWizard.tsx, PackagesWidget.tsx, steps/ (ClassType, Date, Time, Participants, Contact, Cart, Payment, Confirmation)
│   ├── admin/     BookingSettings, PaymentConfig
│   ├── sections/  Secciones reutilizables de landing (se montan en 8+ páginas)
│   ├── seo/       SEOHead (LocalBusiness JSON-LD), BlogPostingSchema, BreadcrumbSchema, FAQSchema, ProductSchema
│   └── ui/        Header, Footer, Hero, Sidebar, FAQ
├── lib/           supabase, seo, classTypes(+Helpers), bookingValidation, antiSpam, emailService, paypalService, squareService, gitDate
├── layouts/BaseLayout.astro
└── styles/global.css                    Tokens de diseño `--c-*`
supabase/                                SQL manual (schema, seeds, migraciones)
astro.config.mjs                         Sitemap (lastmod desde git), redirects 301, imágenes Vercel
```

## SEO (fuente de verdad: `src/lib/seo.ts`)
- Title/description/keywords por ruta viven en `SEO` dentro de `seo.ts`; las pages leen de ahí. Los datos se ajustan con Google Search Console (ver comentarios por ruta).
- `CONTACT` y `EXTERNAL` (teléfono, link de reseñas de Google) están centralizados en `seo.ts`; no hardcodear en componentes.
- **NAP / GBP:** 632 Adams Ave, Cape Canaveral, FL 32920. La dirección visible debe decir **Cape Canaveral**; "Cocoa Beach" solo como keyword/zona de servicio.
- Schema: `LocalBusiness` en `SEOHead.astro`, más Blog/Breadcrumb/FAQ/Product.
- URLs sin trailing slash (`trailingSlash: "never"`); canonical coincide con eso.
- Redirects 301 de URLs viejas en `astro.config.mjs`; revisar ahí antes de renombrar rutas.
- Sitemap excluye `/admin`, `/privacy-policy` y `/terms-of-use` (noindex).

## Reservas

```
/book-now → wizard React → /api/availability en cada paso
         → POST /api/bookings/create → proveedor activo según payment_config
```

- Las reservas se agrupan por `checkout_id` (carrito con varios servicios).
- **Disponibilidad** (primer match gana): `tour_slots` (override por fecha) → `weekly_slots` (horario semanal) → `availability_blocks` (ocultar). Regla de anticipación: `min_advance_hours` en booking settings, 48 h por defecto. Capacidad: `max_capacity`.
- **Pagos activos: on-site, PayPal y Square.** Square es "pay-first": se cobra la tarjeta y solo entonces se guarda la reserva como `confirmed`. Credenciales de PayPal/Square viven en la tabla `payment_config` (se editan en `/admin`), no en env vars. **Credomatic no se usa** (queda solo en los CHECK de los `.sql` de `supabase/`).
- **Catálogo (`class_types`)**: Surf Lessons 1 h ($75) y 2 h ($140) con tiers privado/semi-privado, Group Lessons 1 h ($60) y 2 h ($120) para 4+, Surf Coaching ($75), packs Starter ($260) / Progression ($475) / Elite ($1280) y Summer Camp ($350/semana). Viven en Supabase; `supabase/seed-class-types.sql` es el seed idempotente, regenerarlo al cambiar productos.
- Camp: `camp_sessions` / `camp_session_rooms` / `camp_bookings`, vía `/api/camp/*`.

## Supabase
- Row Level Security activado en todas las tablas; el servidor usa `SUPABASE_SERVICE_ROLE_KEY`.
- Los cambios de esquema se aplican a mano en el SQL editor del dashboard (no hay runner de migraciones). `supabase/schema.sql` es la referencia, más los parches sueltos de la carpeta.
- Tipos TS en `src/lib/supabase.ts`: mantener sincronizados con la BD.

## Variables de entorno
Ver `.env.example`. Requeridas: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `FROM_EMAIL` (dominio verificado en Resend), `REPLY_TO_EMAIL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CONTACT_FORM_SECRET` (opcional), flags `EMAIL_*`. Nunca commitear `.env`.

## Diseño
Sistema "Atlantic Space Coast": tokens `--c-*` en `src/styles/global.css` (teal de marca `#00BCD4`, superficies frías azul-grisáceas). Usar los tokens, no colores sueltos. Tipografía: Inter Variable + Outfit Variable. Iconos: Phosphor vía `astro-icon` (inline SVG, sin JS).

## Gotchas
- **Imágenes en Vercel:** los `widths` de `<Image widths={[...]}>` que no estén en `imagesConfig.sizes` de `astro.config.mjs` se descartan en silencio y la foto sale borrosa. Agregar el tamaño ahí primero.
- Componentes React necesitan `client:load` (o similar) en la página Astro.
- Sin TS estricto de null checks.
- Cocosol aún no tiene canal de YouTube: `VideoSection.astro` oculta el botón de play si no se le pasa `videoId`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
