# Documentación Técnica — Pura Vida Surf School

**Versión:** Mayo 2026  
**Sitio en producción:** https://puravidasurfschool.com  
**Repositorio local:** `pvss-full/`

---

## Índice

1. [Stack tecnológico](#1-stack-tecnológico)
2. [Estructura de archivos](#2-estructura-de-archivos)
3. [Base de datos — Supabase](#3-base-de-datos--supabase)
4. [Flujo de reserva (Booking Wizard)](#4-flujo-de-reserva-booking-wizard)
5. [Sistema de disponibilidad](#5-sistema-de-disponibilidad)
6. [Sistema de pagos](#6-sistema-de-pagos)
7. [API Endpoints](#7-api-endpoints)
8. [Email transaccional](#8-email-transaccional)
9. [SEO técnico](#9-seo-técnico)
10. [Deploy y entorno](#10-deploy-y-entorno)
11. [Variables de entorno](#11-variables-de-entorno)
12. [Comandos de desarrollo](#12-comandos-de-desarrollo)
13. [Tareas operativas comunes](#13-tareas-operativas-comunes)

---

## 1. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework principal | Astro | 5.x |
| UI interactiva | React | 18.x |
| Estilos | Tailwind CSS | 3.x |
| Base de datos | Supabase (PostgreSQL) | SDK 2.x |
| Hosting / Deploy | Vercel | adapter oficial Astro |
| Optimización de imágenes | Vercel Image Service (vía Astro adapter) | — |
| Email transaccional | Resend | — |
| Pagos | PayPal REST API v2 + On-site + Credomatic (placeholder) | — |
| TypeScript | TypeScript | 5.x |

**Modo de renderizado:** `output: "server"` (SSR completo en Vercel). Las páginas estáticas de marketing y blog se sirven desde el edge; los endpoints de API y el wizard de reservas se ejecutan en el servidor.

---

## 2. Estructura de archivos

```
pvss-full/
├── src/
│   ├── pages/
│   │   ├── index.astro                          ← Homepage
│   │   ├── book-now.astro                       ← Página de reservas (monta BookingWizard)
│   │   ├── admin.astro                          ← Dashboard de administrador
│   │   ├── blog.astro                           ← Índice del blog
│   │   ├── blog/                                ← 8 artículos de blog (long-tail SEO)
│   │   ├── [service].astro                      ← ~15 páginas de servicios/tours
│   │   ├── sitemap-index.xml.ts                 ← Sitemap dinámico (API route)
│   │   ├── privacy-policy.astro
│   │   ├── terms-of-use.astro
│   │   └── api/
│   │       ├── availability.ts                  ← Disponibilidad de slots en tiempo real
│   │       ├── class-types.ts                   ← Lista de servicios activos
│   │       ├── payment-config.ts                ← Config de proveedor de pago activo
│   │       ├── bookings/
│   │       │   ├── create.ts                    ← Crear reservas + routing de pago
│   │       │   ├── capture-paypal.ts            ← Capturar pago PayPal
│   │       │   └── confirm-onsite.ts            ← Confirmar reserva on-site
│   │       ├── camp/
│   │       │   ├── book.ts                      ← Reservas de surf camp
│   │       │   └── sessions.ts                  ← Sesiones de camp
│   │       └── admin/
│   │           ├── bookings.ts                  ← CRUD de reservas (admin)
│   │           ├── payment-config.ts            ← Cambiar proveedor de pago (admin)
│   │           └── booking-settings.ts          ← Ajustes de reserva (admin)
│   │
│   ├── components/
│   │   ├── booking/
│   │   │   ├── BookingWizard.tsx                ← Wizard principal (8 pasos, useReducer)
│   │   │   ├── CampBookingWizard.tsx            ← Wizard para surf camps
│   │   │   ├── PackagesWidget.tsx               ← Widget de paquetes en páginas de servicio
│   │   │   └── steps/
│   │   │       ├── StepClassType.tsx            ← Paso 1: elegir servicio
│   │   │       ├── StepDate.tsx                 ← Paso 2: elegir fecha
│   │   │       ├── StepTime.tsx                 ← Paso 3: elegir hora
│   │   │       ├── StepParticipants.tsx         ← Paso 4: número de personas
│   │   │       ├── StepCart.tsx                 ← Paso 5: carrito (múltiples servicios)
│   │   │       ├── StepContact.tsx              ← Paso 6: datos del cliente
│   │   │       ├── StepPayment.tsx              ← Paso 7: pantalla de pago
│   │   │       └── StepConfirmation.tsx         ← Paso 8: confirmación
│   │   ├── admin/
│   │   │   ├── BookingSettings.astro
│   │   │   └── PaymentConfig.astro
│   │   ├── sections/                            ← Secciones de landing (WhyChooseUs, Video, etc.)
│   │   ├── ui/                                  ← Componentes reutilizables (Header, Footer, Hero, FAQ)
│   │   └── seo/
│   │       ├── SEOHead.astro                    ← Meta tags + JSON-LD global
│   │       ├── FAQSchema.astro                  ← Schema FAQPage
│   │       ├── ProductSchema.astro              ← Schema Service + Offer
│   │       ├── BreadcrumbSchema.astro           ← Schema BreadcrumbList
│   │       └── BlogPostingSchema.astro          ← Schema BlogPosting
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro                     ← Layout global (SEOHead + Header + Footer + WhatsApp)
│   │
│   ├── lib/
│   │   ├── supabase.ts                          ← Cliente Supabase + tipos DbBooking, DbAvailabilityBlock
│   │   ├── seo.ts                               ← Datos SEO centralizados por página (seoData)
│   │   ├── paypalService.ts                     ← PayPal REST API (create order, capture, get)
│   │   ├── emailService.ts                      ← Plantillas HTML + envío vía Resend
│   │   ├── classTypes.ts                        ← Queries a tabla class_types en Supabase
│   │   ├── classTypeHelpers.ts                  ← Helpers: calculateTotal, getMin/MaxParticipants
│   │   └── bookingConfig.ts                     ← Constantes de configuración de reservas
│   │
│   ├── styles/
│   │   └── global.css                           ← Variables CSS + Tailwind base
│   └── assets/
│       └── images/                              ← Imágenes optimizadas (.webp) procesadas por Astro
│
├── supabase/
│   ├── schema.sql                               ← Schema completo + seeds + migraciones
│   └── manual_payment_schema_repair.sql         ← Parche de migración (Stripe → external_payment_id)
│
├── public/
│   ├── robots.txt
│   ├── favicon.svg
│   └── images/                                  ← Imágenes estáticas referenciadas en schemas JSON-LD
│
├── astro.config.mjs                             ← Config Astro (SSR, redirects 301, prefetch)
├── tailwind.config.mjs
├── package.json
└── .env.example
```

---

## 3. Base de datos — Supabase

### Tablas principales

#### `bookings`

Tabla central. Cada fila es una reserva individual. Las reservas del mismo checkout se agrupan por `checkout_id`.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `checkout_id` | UUID | Agrupa items del mismo carrito |
| `class_type_id` | VARCHAR | FK lógica a `class_types.id` |
| `booking_date` | DATE | Fecha de la lección |
| `start_time` | TIME | Hora de inicio |
| `participants` | INTEGER | ≥ 1 |
| `total_amount` | DECIMAL(10,2) | Total calculado en el servidor |
| `customer_name` | VARCHAR(255) | |
| `customer_email` | VARCHAR(255) | |
| `customer_phone` | VARCHAR(50) | |
| `customer_country` | VARCHAR(100) | |
| `notes` | TEXT | Notas opcionales del cliente |
| `status` | VARCHAR | `pending` / `confirmed` / `cancelled` |
| `payment_method` | VARCHAR | `on-site` / `paypal` / `credomatic` |
| `external_payment_id` | VARCHAR(255) | PayPal Order ID u otro |
| `checkout_summary_sent_at` | TIMESTAMPTZ | Timestamp del email al cliente |
| `checkout_admin_summary_sent_at` | TIMESTAMPTZ | Timestamp del email al admin |
| `created_at` / `updated_at` | TIMESTAMPTZ | Auto-updated por trigger |

**Índices:** `booking_date`, `(class_type_id, booking_date)`, `status`, `customer_email`, `checkout_id`

#### `class_types`

Servicios disponibles para reservar. Reemplaza la configuración hardcodeada anterior.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | VARCHAR PK | e.g. `private`, `group`, `camp-7-private` |
| `name` | VARCHAR(255) | Nombre público |
| `category` | VARCHAR | `lesson` / `package` / `camp` |
| `price_per_person` | DECIMAL(10,2) | Precio base por persona |
| `min_participants_per_booking` | INTEGER | Mínimo requerido |
| `max_participants_per_booking` | INTEGER | Máximo permitido por reserva |
| `max_capacity` | INTEGER | Capacidad máxima total del slot |
| `duration_minutes` | INTEGER | Duración (default 90) |
| `description` | TEXT | |
| `included` | TEXT[] | Array de items incluidos |
| `badge` | VARCHAR(100) | Badge opcional (e.g. "Most Popular") |
| `active` | BOOLEAN | Si aparece en el wizard |
| `sort_order` | INTEGER | Orden de aparición |

**Servicios seed (10):**

| ID | Nombre | Categoría | Precio/persona |
|---|---|---|---|
| `private` | Private Surf Lesson | lesson | $90.40 |
| `semi-private` | Semi-Private Lesson | lesson | $73.00 |
| `group` | Group Surf Lesson | lesson | $55.00 |
| `pkg-3-private` | 3-Day Private Package | package | $326.00 |
| `pkg-3-semi` | 3-Day Semi-Private Package | package | $326.00 |
| `pkg-5-private` | 5-Day Private Package | package | $620.87 |
| `pkg-5-semi` | 5-Day Semi-Private Package | package | $563.87 |
| `camp-5-days` | 5 Days Surf Camp | camp | $1,049.00 |
| `camp-7-private` | 7-Day Private Package | camp | $694.95 |
| `camp-7-semi` | 7-Day Semi-Private Package | camp | $620.37 |

#### `tour_slots`

Sobreescrituras de slots para una fecha específica. Tiene prioridad sobre `weekly_slots`.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `class_type_id` | VARCHAR | |
| `slot_date` | DATE | Fecha específica |
| `start_time` | TIME | Hora del slot |

#### `weekly_slots`

Plantilla de horarios recurrentes por día de la semana. Se usa cuando no hay `tour_slots` para la fecha.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `class_type_id` | VARCHAR | FK a `class_types.id` ON DELETE CASCADE |
| `day_of_week` | INTEGER | 1=Lun ... 7=Dom (ISO) |
| `start_time` | TIME | |

#### `availability_blocks`

Bloqueos suaves. Ocultan slots específicos sin eliminarlos del horario.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | SERIAL PK | |
| `class_type_id` | VARCHAR | NULL = bloquea todos los servicios |
| `blocked_date` | DATE | |
| `start_time` | TIME | NULL = bloquea todo el día |
| `reason` | VARCHAR(255) | Uso interno |

#### `booking_settings`

Tabla de configuración general con una sola fila (`id = 1`).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INTEGER | Siempre 1 |
| `min_advance_hours` | INTEGER | Anticipación mínima para reservar (default: 48h) |

#### `payment_config`

Una sola fila activa (`is_active = true`, forzado por índice único parcial).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `provider` | VARCHAR | `on-site` / `paypal` / `credomatic` |
| `paypal_client_id` | VARCHAR(255) | |
| `paypal_secret` | VARCHAR(255) | |
| `paypal_sandbox` | BOOLEAN | |
| `credomatic_api_key` | VARCHAR(255) | Placeholder |
| `is_active` | BOOLEAN | Solo una fila puede ser `true` |

---

## 4. Flujo de reserva (Booking Wizard)

El wizard es un componente React (`BookingWizard.tsx`) montado con `client:load` en `book-now.astro`. Gestiona estado con `useReducer`.

### Los 8 pasos

```
Paso 1 — StepClassType    → El cliente elige el servicio (private, group, camp…)
Paso 2 — StepDate         → El cliente elige la fecha (consulta disponibilidad)
Paso 3 — StepTime         → El cliente elige el horario disponible
Paso 4 — StepParticipants → Número de personas (validado contra min/max del class_type)
Paso 5 — StepCart         → Resumen del carrito (puede agregar más servicios o editar)
Paso 6 — StepContact      → Nombre, email, teléfono, país, notas
                            → POST /api/bookings/create (crea las reservas en Supabase)
Paso 7 — StepPayment      → Renderiza la UI del proveedor activo (PayPal / on-site / Credomatic)
Paso 8 — StepConfirmation → Confirmación final
```

### Estado del wizard (`WizardState`)

```typescript
{
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  classTypeId: string | null
  date: string | null
  timeSlot: string | null
  participants: number
  cartItems: CartItem[]           // Soporte para múltiples servicios en un checkout
  editingCartIndex: number | null // Para editar un item ya en el carrito
  contact: ContactInfo
  bookingIds: string[]            // IDs retornados por /api/bookings/create
  totalAmount: number
  paymentProvider: 'on-site' | 'paypal' | 'credomatic' | null
  paypalOrderId: string | null
  paypalSandbox: boolean
  paypalClientId: string
}
```

### CartItem (soporte multi-servicio)

Un cliente puede agregar múltiples servicios en un solo checkout. Cada item en el carrito tiene:

```typescript
{
  classTypeId: string
  date: string        // YYYY-MM-DD
  timeSlot: string    // HH:MM
  participants: number
}
```

Todos los items se envían juntos al `POST /api/bookings/create` y se persisten con el mismo `checkout_id`.

---

## 5. Sistema de disponibilidad

Endpoint: `GET /api/availability?classTypeId=X&date=YYYY-MM-DD`

### Prioridad de resolución (primera match gana)

```
1. tour_slots        → Slots específicos para esa fecha exacta
2. weekly_slots      → Slots semanales del día de la semana correspondiente
3. (vacío)           → Sin slots disponibles ese día
```

### Filtros adicionales

- **Regla de anticipación mínima:** Configurada en `booking_settings.min_advance_hours` (default 48h). Un slot no aparece como disponible si su fecha/hora está dentro del umbral desde ahora.
- **Availability blocks:** Los slots que coincidan con un registro en `availability_blocks` para esa fecha se marcan como `available: false`.

### Respuesta

```json
{
  "slots": [
    { "time": "08:00", "available": true, "remaining": null },
    { "time": "10:00", "available": false, "remaining": null }
  ]
}
```

`remaining` está preparado para implementar capacidad en tiempo real (actualmente `null`).

---

## 6. Sistema de pagos

El proveedor activo se determina en tiempo de ejecución leyendo `payment_config` desde Supabase. El admin puede cambiarlo desde `/admin`.

### Flujo en `POST /api/bookings/create`

```
1. Validar items + contacto
2. Calcular total
3. Generar checkout_id (UUID)
4. Leer payment_config (proveedor activo)

Si on-site:
  → Insertar bookings con status: 'confirmed'
  → Enviar emails al cliente y al admin
  → Retornar { provider: 'on-site', bookingIds }

Si paypal (sin credenciales):
  → Insertar bookings con status: 'pending'
  → Retornar { provider: 'paypal', paypalOrderId: null }

Si paypal (con credenciales):
  → createPayPalOrder() → obtener paypalOrderId
  → Insertar bookings con status: 'pending', external_payment_id: paypalOrderId
  → Retornar { provider: 'paypal', paypalOrderId, paypalClientId, paypalSandbox }

Si credomatic:
  → Insertar bookings con status: 'pending'
  → Retornar { provider: 'credomatic' } (admin confirma manualmente)
```

### PayPal — flujo completo

```
Cliente aprueba en el SDK de PayPal (StepPayment)
    ↓
POST /api/bookings/capture-paypal { orderId, bookingIds }
    ↓
capturePayPalOrder() — llama a PayPal v2/checkout/orders/:id/capture
    ↓
Actualizar bookings SET status='confirmed', external_payment_id=orderId
    ↓
Enviar emails de confirmación
```

### `paypalService.ts` — funciones exportadas

| Función | Descripción |
|---|---|
| `createPayPalOrder(clientId, secret, amount, currency, sandbox)` | Crea una orden PayPal, retorna `orderId` |
| `capturePayPalOrder(clientId, secret, orderId, sandbox)` | Captura el pago de una orden aprobada |
| `getPayPalOrder(clientId, secret, orderId)` | Obtiene estado de una orden existente |

El access token de PayPal se cachea en memoria con su tiempo de expiración para evitar llamadas innecesarias.

---

## 7. API Endpoints

Todos los endpoints tienen `export const prerender = false` para forzar renderizado en servidor.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/availability` | Slots disponibles para un classType y fecha |
| `GET` | `/api/class-types` | Lista de servicios activos desde Supabase |
| `GET` | `/api/payment-config` | Proveedor de pago activo (sin secretos) |
| `POST` | `/api/bookings/create` | Crear reservas + iniciar flujo de pago |
| `POST` | `/api/bookings/capture-paypal` | Capturar pago PayPal y confirmar reservas |
| `POST` | `/api/bookings/confirm-onsite` | Confirmar reserva on-site manualmente |
| `GET/POST` | `/api/admin/bookings` | CRUD de reservas (requiere autenticación admin) |
| `GET/POST` | `/api/admin/payment-config` | Gestionar proveedor de pago desde admin |
| `GET/POST` | `/api/admin/booking-settings` | Ajustes generales (ej. min_advance_hours) |
| `GET` | `/api/camp/sessions` | Sesiones disponibles de surf camp |
| `POST` | `/api/camp/book` | Reservar un surf camp |
| `GET` | `/sitemap-index.xml` | Sitemap XML dinámico (30 URLs) |

---

## 8. Email transaccional

Proveedor: **Resend**. Implementado en `src/lib/emailService.ts`.

### Emails enviados

| Trigger | Destinatario | Descripción |
|---|---|---|
| Booking on-site confirmada | Cliente | Resumen del carrito con todos los servicios |
| Booking on-site confirmada | Admin | Copia del resumen para gestión interna |
| Booking PayPal capturada | Cliente | Confirmación de pago + detalles |
| Booking PayPal capturada | Admin | Notificación de pago recibido |

### Control por variables de entorno

```env
EMAIL_SUMMARY_ENABLED=true         # Activa email al cliente
EMAIL_ADMIN_SUMMARY_ENABLED=true   # Activa email al admin
```

Los emails se construyen con HTML inline en `emailService.ts` usando la función `emailShell()` como plantilla base.

---

## 9. SEO técnico

### Arquitectura SEO

Todas las páginas extienden `BaseLayout.astro` → `SEOHead.astro`, que emite:

- `<title>` + `<meta name="description">`
- `<link rel="canonical">` (generado automáticamente desde el `slug`)
- Open Graph completo (og:type, og:url, og:title, og:description, og:image, og:locale)
- Twitter Card `summary_large_image`
- JSON-LD con `@graph`: `LocalBusiness` + `SportsActivityLocation` + `WebPage` + `WebSite`

### Datos SEO centralizados

`src/lib/seo.ts` — objeto `seoData` con entrada por página:

```typescript
{
  slug: string       // URL canónica
  keyfocus: string   // Keyword principal
  title: string      // <title>
  description: string
  synonyms: string[] // Keywords relacionadas (metadata, no emitidas en HTML)
  related: string[]  // Internal linking (metadata)
}
```

### Schemas JSON-LD por tipo de contenido

| Componente | Schema | Usado en |
|---|---|---|
| `SEOHead.astro` | LocalBusiness + SportsActivityLocation + WebPage + WebSite | Todas las páginas |
| `FAQSchema.astro` | FAQPage | Homepage, páginas de servicio con FAQ |
| `ProductSchema.astro` | Service + Offer | Páginas de servicios individuales |
| `BreadcrumbSchema.astro` | BreadcrumbList | Blog posts, páginas de servicio |
| `BlogPostingSchema.astro` | BlogPosting | Artículos del blog |

### Sitemap

Generado dinámicamente en `src/pages/sitemap-index.xml.ts` (API route). Cubre 30 URLs con `changefreq` y `priority` por tipo de contenido. Accesible en `/sitemap-index.xml` (redirect 301 desde `/sitemap.xml`).

### robots.txt (`public/robots.txt`)

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://puravidasurfschool.com/sitemap-index.xml
```

### Redirects 301 (`astro.config.mjs`)

| Origen | Destino |
|---|---|
| `/sitemap.xml` | `/sitemap-index.xml` |
| `/surf-lessons-tamarindo` | `/tamarindo-surf-lessons` |
| `/7-days-surf-camp-package` | `/7-days-surf-camp-tamarindo` |
| `/contact` | `/surf-school-near-me-tamarindo` |
| `/about` | `/best-surf-school-in-tamarindo` |
| `/about-us` | `/best-surf-school-in-tamarindo` |
| `/book` | `/book-now` |
| `/booking` | `/book-now` |

### Optimización de imágenes

- Componente `<Image>` de Astro en todas las imágenes
- Formatos: `avif` + `webp` (fallback automático)
- `loading="lazy"` + `decoding="async"` en imágenes below-the-fold
- `HeroPreload.astro` en el hero de cada página para `<link rel="preload">` del LCP
- `sizes` y `widths` configurados por contexto para evitar imágenes sobredimensionadas

---

## 10. Deploy y entorno

**Plataforma:** Vercel  
**Trigger de deploy:** `git push origin master` → Vercel auto-deploy

**Build local antes de push:**
```bash
npm run build    # Verificar que compila sin errores
npm run astro check  # Verificar tipos TypeScript
```

**Configuración en Vercel:**
- Adapter: `@astrojs/vercel` con `imageService: true`
- Variables de entorno: configurar en el dashboard de Vercel (nunca en `.env` commiteado)
- `compressHTML: true` — HTML minificado en producción
- `build.inlineStylesheets: "always"` — CSS crítico inlineado en el `<head>`
- `prefetch.defaultStrategy: "hover"` — prefetch de páginas al hacer hover en links

---

## 11. Variables de entorno

Copiar `.env.example` a `.env` para desarrollo local.

```env
# Supabase (requerido)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@puravidasurfschool.com
ADMIN_EMAIL=admin@puravidasurfschool.com

# Controles de email (opcional, default: true)
EMAIL_SUMMARY_ENABLED=true
EMAIL_ADMIN_SUMMARY_ENABLED=true

# PayPal (solo si payment_config.provider = 'paypal')
# Los valores reales se guardan en la tabla payment_config de Supabase
# Estas vars son fallback para desarrollo local
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
PAYPAL_SANDBOX=true

# URL pública (para PayPal return_url)
PUBLIC_SITE_URL=https://puravidasurfschool.com
```

> **Nota:** Las credenciales de PayPal se almacenan en la tabla `payment_config` de Supabase, no en variables de entorno, para permitir rotación sin redeploy desde el dashboard de admin.

---

## 12. Comandos de desarrollo

```bash
# Desde pvss-full/
npm run dev        # Dev server en localhost:4321 (hot reload)
npm run build      # Build de producción → dist/
npm run preview    # Preview del build local
npm run astro check  # TypeScript check
```

---

## 13. Tareas operativas comunes

### Agregar un nuevo servicio

1. Insertar en `class_types` en Supabase con el `id`, precios y capacidades correctas
2. Insertar horarios en `weekly_slots` para cada día que opera
3. Crear página `.astro` con URL semántica en `src/pages/`
4. Agregar entrada en `seo.ts` con title, description y keyfocus
5. Agregar la URL al sitemap en `src/pages/sitemap-index.xml.ts`
6. Actualizar navegación en `Header.astro` y `Footer.astro` si aplica

### Cambiar el proveedor de pago

Desde el dashboard en `/admin` → Payment Config, o directamente en Supabase:

```sql
UPDATE payment_config SET provider = 'paypal' WHERE is_active = true;
```

No requiere redeploy. El cambio es efectivo en la siguiente solicitud.

### Gestionar disponibilidad

| Acción | Tabla | Operación |
|---|---|---|
| Cerrar una fecha específica | `availability_blocks` | INSERT con `blocked_date` sin `start_time` |
| Bloquear un horario en una fecha | `availability_blocks` | INSERT con `blocked_date` + `start_time` |
| Agregar horario recurrente | `weekly_slots` | INSERT con `class_type_id` + `day_of_week` + `start_time` |
| Sobreescribir horarios de una fecha | `tour_slots` | INSERT con `class_type_id` + `slot_date` + `start_time` |
| Cambiar anticipación mínima | `booking_settings` | UPDATE SET `min_advance_hours = X` WHERE id = 1 |

### Aplicar cambios al schema de Supabase

No hay migration runner. Los cambios se aplican manualmente en el SQL Editor de Supabase dashboard usando `supabase/schema.sql` como referencia.

### Confirmación manual de reservas (Credomatic / admin)

1. Cliente completa el wizard → reserva queda en `status: 'pending'`
2. Admin verifica el pago en el sistema externo
3. Desde `/admin` → cambiar `status` a `confirmed`
4. El email de confirmación al cliente se envía desde el admin panel

---

*Última actualización: Mayo 2026*
