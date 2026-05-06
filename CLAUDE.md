# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Pura Vida Surf School — Proyecto

## Stack
- **Frontend:** Astro (con islas React donde se necesite interactividad)
- **Base de datos / Auth / Storage:** Supabase
- **Pagos:** on site, paypal o credomatic costa rica 
- **Styling:** Tailwind CSS
- **Deploy:** Por definir (Vercel o VPS)

## Tipo de proyecto
Landing + plataforma de reservas para escuela de surf en Guanacaste.
Orientado a turistas internacionales → SEO en inglés es prioridad.

## Prioridades del proyecto
1. SEO técnico sólido (Astro es ideal para esto)
2. Conversión: cada página trabaja para generar reservas
3. Performance: Core Web Vitals en verde
4. Stripe checkout limpio y confiable

## Convenciones
- Páginas estáticas en Astro puro (sin JS innecesario)
- Interactividad (formularios, checkout) → React islands con `client:load`
- Supabase Row Level Security activado en todas las tablas
- Contenido en inglés (mercado turístico internacional)

## Skills activos en este proyecto
- `frontend-design` → componentes UI, landing, páginas de clases/tours
- `seo-audit` → auditorías técnicas, on-page SEO, meta tags, schema markup
- `file-reading` → cuando se suban archivos al contexto

## Skills bajo demanda (pedir explícitamente)
- `ui-ux-pro-max` → si hay rediseño mayor o sistema de diseño nuevo

## Notas SEO importantes
- Cada página de clase/tour debe tener su propia URL semántica
- Schema markup: LocalBusiness + SportsActivityLocation + Event
- Blog en inglés para long-tail keywords de surf en Guanacaste
- Google Business Profile conectado al sitio

---

## Project Overview

**Pura Vida Surf School (PVSS)** is a full-stack booking system for a surf school in Tamarindo, Costa Rica. The site allows customers to browse services, reserve lessons/camps, and pay online; administrators manage everything from a private dashboard.

- **Live site:** https://puravidasurfschool.com
- **Tech stack:** Astro 5 + React 18 + Tailwind CSS (frontend); Supabase + Vercel (backend/hosting)
- **Database:** PostgreSQL via Supabase
- **Status:** Production with ongoing feature development

---

## Development Commands

All commands are run from the `pvss-full/` directory:

```bash
npm run dev      # Start dev server on localhost:4321 (hot reload, watch Tailwind)
npm run build    # Build static site for production (outputs to dist/)
npm run preview  # Preview the built site locally
npm run astro    # Access Astro CLI directly (astro check, astro sync, etc.)
```

No linting or test framework configured. TypeScript is checked via Astro's built-in type checking.

---

## Architecture at a Glance

### Booking Flow (The Core Feature)

```
Customer visits /book-now
    ↓
React wizard (8 steps): service → date → time → participants → contact → cart → payment → confirm
    ↓ (each step queries /api/availability in real time)
    ↓
POST /api/bookings/create
    ├─ Validates data
    ├─ Creates payment record in Supabase (status: pending)
    ├─ Redirects to payment provider (on-site, PayPal, or Credomatic)
    └─ On-site and Credomatic: admin confirms manually
    └─ PayPal: webhook confirms automatically

Admin dashboard (/admin) displays all bookings, controls scheduling
```

**Key insight:** Bookings are grouped by `checkout_id` (cart support), not by individual tours. A single checkout can contain multiple services.

### Three-Layer Availability System

Availability is resolved in priority order (first match wins):

1. **tour_slots** — overrides for a specific date (e.g., "closed Dec 25 for holiday")
2. **weekly_slots** — repeating schedule by day of week (e.g., "Mon-Fri: 8am, 10am, 2pm")
3. **availability_blocks** — soft blocks that hide slots without alternatives

Additional constraints:
- **48-hour rule:** No slots available for bookings less than 48 hours away
- **Capacity:** Max participants limited by `max_capacity` (or `tour_capacity` if set)

---

## Project Structure

```
pvss-full/
├── src/
│   ├── pages/
│   │   ├── index.astro              ← Homepage
│   │   ├── book-now.astro           ← Booking page (mounts React wizard)
│   │   ├── admin.astro              ← Admin dashboard
│   │   ├── api/
│   │   │   ├── bookings/create.ts   ← Main booking handler (routes to payment)
│   │   │   └── availability.ts      ← Real-time slot availability
│   │   └── [service].astro          ← 20+ service detail pages (lessons, camps, etc.)
│   │
│   ├── components/
│   │   ├── booking/
│   │   │   ├── BookingWizard.tsx    ← Main React component (8 steps)
│   │   │   ├── steps/               ← Individual wizard steps
│   │   │   │   ├── StepService.tsx
│   │   │   │   ├── StepDate.tsx
│   │   │   │   ├── StepTime.tsx
│   │   │   │   ├── StepPayment.tsx  ← Handles on-site/PayPal/Credomatic UI
│   │   │   │   └── StepConfirmation.tsx
│   │   │   └── BookingCart.tsx
│   │   ├── admin/                   ← Admin dashboard components
│   │   ├── sections/                ← Landing page sections
│   │   └── ui/                      ← Reusable UI (buttons, inputs, etc.)
│   │
│   ├── lib/
│   │   ├── supabase.ts              ← Client & DB types (DbBooking, DbTour, etc.)
│   │   ├── paypalService.ts         ← PayPal integration (create order, capture, etc.)
│   │   └── emailService.ts          ← Email templates & sending (Resend)
│   │
│   ├── layouts/                     ← Page templates
│   ├── styles/                      ← Global CSS, Tailwind config
│   └── assets/                      ← Images, fonts
│
├── supabase/
│   └── schema.sql                  ← Full DB schema & migrations
│
├── astro.config.mjs                ← Framework config (includes 301 redirects)
├── tailwind.config.mjs             ← Tailwind config
├── package.json                    ← Dependencies & scripts
└── .env.example                    ← Template for env vars
```

**Key files across multiple concerns:**
- **Booking state flow:** `src/lib/supabase.ts` (types) → `src/pages/api/bookings/create.ts` (handler) → `src/components/booking/` (UI)
- **Availability logic:** `src/pages/api/availability.ts` (main) → uses `tour_slots`, `weekly_slots`, `availability_blocks` from Supabase
- **Payment routing:** `src/components/booking/steps/StepPayment.tsx` (UI) → `src/pages/api/bookings/create.ts` (provider selection)

---

## Database Schema (Supabase)

Key tables:

- **bookings** — Individual lesson/camp bookings with `checkout_id` (cart grouping), `status` (pending/confirmed/cancelled), external payment IDs
- **tours** — Available services (lessons, camps, packages); defines `max_capacity` per slot
- **tour_slots** — Date-specific overrides for availability (e.g., "closed on X date")
- **weekly_slots** — Repeating schedule by weekday (e.g., "Mondays always 8am, 10am")
- **availability_blocks** — Soft blocks that hide slots
- **payment_config** — Configuration table that drives which payment provider is active (on-site, PayPal, Credomatic) and stores credentials for the active payment gateway.

TypeScript types are in `src/lib/supabase.ts` — these are auto-generated from the DB and should be kept in sync.

---

## Payment Methods (Costa Rica-Specific)

⚠️ **April 2026 Status:** The system now uses PayPal, on-site, and Credomatic only.

- **On-site:** Customer pays at location; booking auto-confirms immediately (for testing/demos)
- **PayPal:** Uses PayPal REST API; webhook confirms booking when payment captured
- **Credomatic:** Costa Rica-specific gateway; currently placeholder (admin confirms manually)

Payment method is determined by `payment_config` table in Supabase. The UI in `StepPayment.tsx` renders conditionally based on active provider. Routing logic in `src/pages/api/bookings/create.ts` dispatches to the appropriate handler.

---

## Environment Variables

Required (Supabase):
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Payment providers (conditional):
```env
# PayPal (if active in payment_config)
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
PAYPAL_SANDBOX=true  # or false for live

# Credomatic (if active; currently placeholder)
CREDOMATIC_API_KEY=...  # stored in payment_config instead

# On-site needs no env vars
```

Email (Resend):
```env
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@...
ADMIN_EMAIL=admin@...
```

---

## Common Tasks & Workflows

### Adding a New Service (Tour)

1. Create new `.astro` page in `src/pages/[service].astro` with SEO-friendly slug
2. Insert tour record in Supabase `tours` table with name, description, `max_capacity`
3. Configure `weekly_slots` for the tour (what times it runs each week)
4. Update sidebar/nav component to list the service

### Editing Availability

- **One-off closure** (e.g., "closed Dec 25"): Insert into `tour_slots` with `status: closed`
- **Repeating schedule change** (e.g., "new winter hours"): Update `weekly_slots`
- **Soft hide a slot** (e.g., "don't show 5pm"): Insert into `availability_blocks`

All changes visible in real time via `/api/availability` — React wizard reads it on every step.

### Testing Payment Flow

1. Set `.env` to test credentials (PayPal sandbox, etc.)
2. Visit `/book-now` and complete wizard
3. For on-site: booking auto-confirms (no real payment)
4. For PayPal: sandbox redirects back with test approval
5. Check Supabase `bookings` table for status updates
6. Admin can review/confirm in `/admin`

### Deploying to Production

```bash
git push origin main
```

Vercel auto-deploys. Verify:
- `npm run build` succeeds locally first
- No TypeScript errors (`npm run astro check`)
- `.env` production secrets are set in Vercel dashboard (never commit `.env`)

---

## Known Constraints & Notes

- **TypeScript without strict null checks:** The project compiles with looser TS settings for Astro compatibility
- **No testing framework:** Unit tests not currently configured; rely on manual testing and TypeScript for correctness
- **Astro integration notes:** React components must be explicitly marked with `client:load` or similar directives in Astro pages to hydrate client-side
- **Supabase migrations:** Schema changes in `schema.sql` must be applied manually in Supabase dashboard (no migration runner configured)
- **SEO redirects:** Old WordPress URLs have 301 redirects configured in `astro.config.mjs`; check there before renaming routes

---

## For More Detail

- **[README.md](../README.md)** — Business overview and quick start
- **[QUICK_START.md](../QUICK_START.md)** — Setup instructions
- **[DOCUMENTACION_TECNICA.md](../DOCUMENTACION_TECNICA.md)** — Deep technical reference (90+ min read)
- **[INDICE_MAESTRO.md](../INDICE_MAESTRO.md)** — Search index by topic

