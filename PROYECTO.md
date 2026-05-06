# Pura Vida Surf School — Documentación del Proyecto

## ¿Qué es este proyecto?

Sitio web completo para **Pura Vida Surf School**, una escuela de surf ubicada en **Tamarindo, Guanacaste, Costa Rica**. El sistema permite a los clientes explorar los servicios, reservar lecciones y surf camps directamente en línea, y pagar con tarjeta. El negocio gestiona todo desde un panel de administración propio.

**Dominio en producción:** `https://puravidasurfschool.com`

---

## Stack Tecnológico

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| Framework | Astro | 5.x | Motor principal del sitio |
| UI interactiva | React | 18.x | Solo para el wizard de reservas |
| Estilos | Tailwind CSS | 3.4 | Utility-first, sin CSS custom salvo admin |
| Lenguaje | TypeScript | 5.9 | Todo el código tipado |
| Base de datos | Supabase (PostgreSQL) | 2.x | Bookings, disponibilidad, tipos de clase |
| Pagos | PayPal / On-site / Credomatic | — | Cobro con pago online + webhooks |
| Emails | Resend | API REST | Confirmaciones y notificaciones admin |
| Hosting | Vercel | — | Deploy, CDN, headers de seguridad |
| Fuente | Inter Variable | — | Tipografía principal |

### Cómo se relacionan

```
Cliente (browser)
    │
    ├── Páginas estáticas (Astro → HTML/CSS/JS)
    │       └── Booking Wizard (React, client-side)
    │               │
    │               └── POST /api/bookings/create
    │                       ├── Valida datos
    │                       ├── Crea booking en Supabase (status: pending)
    │                       ├── Inicia pago con el proveedor activo
    │                       └── Devuelve información de pago al browser
    │
    └── Proveedor de pago (PayPal / On-site / Credomatic)
            │
            └── Webhook o confirmación de pago
                    ├── Confirma booking en Supabase (status: confirmed)
                    └── Envía emails via Resend
```

---

## Identidad Visual

| Elemento | Valor |
|---|---|
| Color primario | `#00BCD4` (Teal 500) |
| Color hover/acción | `#0097A7` (Teal 600) |
| Color acento claro | `#26C6DA` (Teal 400) |
| Color fondo oscuro | `#0A1628` (Navy 900) |
| Gradiente hero emails | `#0b5f66` → `#0f766e` → `#14b8a6` |
| Tipografía | Inter Variable (sans-serif) |

---

## Estructura de Carpetas

```
pvss-full/
├── src/
│   ├── pages/              ← Todas las páginas del sitio + rutas API
│   │   ├── api/            ← Endpoints del servidor (no se pre-renderizan)
│   │   └── admin.astro     ← Panel de administración
│   ├── components/
│   │   ├── booking/        ← Wizard de reservas (React)
│   │   ├── sections/       ← Secciones reutilizables (Testimonials, NeedHelp…)
│   │   ├── seo/            ← Schemas estructurados (FAQ, Breadcrumb, Product)
│   │   └── ui/             ← Header, Footer, FAQ, Hero…
│   ├── layouts/
│   │   └── BaseLayout.astro ← Layout base con SEO head
│   ├── lib/                ← Lógica de negocio y servicios
│   │   ├── seo.ts          ← Datos SEO de todas las páginas
│   │   ├── bookingConfig.ts ← Tipos de clase y precios (fallback local)
│   │   ├── classTypes.ts   ← Tipos de clase desde Supabase (con caché 60s)
│   │   ├── classTypeHelpers.ts ← Helpers de cálculo y formato
│   │   ├── emailService.ts ← Templates HTML y envío via Resend
│   │   └── supabase.ts     ← Cliente Supabase + interfaces TypeScript
│   ├── assets/images/      ← Imágenes optimizadas por Astro (webp)
│   └── styles/
│       └── global.css      ← Reset y estilos base
├── public/
│   └── images/             ← Imágenes estáticas (hero, logo)
├── supabase/
│   └── schema.sql          ← Schema completo de la base de datos
├── .env                    ← Variables de entorno (no commitear)
├── astro.config.mjs        ← Config de Astro (redirects, integraciones)
├── tailwind.config.mjs     ← Paleta de colores y fuentes
└── vercel.json             ← Headers de seguridad y redirects en CDN
```

---

## Módulos del Sistema

### 1. Sitio Público (20 páginas)

Todas las páginas son **estáticas** (generadas en build time). Cada una tiene su propio SEO configurado en `src/lib/seo.ts`.

| URL | Descripción |
|---|---|
| `/` | Home principal |
| `/tamarindo-surf-lessons` | Hub de lecciones |
| `/private-surf-lessons-tamarindo` | Lección privada (1:1) |
| `/semi-private-surf-lessons-tamarindo` | Lección semi-privada (2–3 pax) |
| `/group-surf-lessons-tamarindo` | Lección grupal (hasta 8 pax) |
| `/tamarindo-surf-packages` | Hub de paquetes |
| `/3-days-pura-vida-surf-package` | Paquete 3 días |
| `/5-days-pura-vida-surf-package` | Paquete 5 días |
| `/7-days-pura-vida-surf-package` | Paquete 7 días |
| `/surf-camp-tamarindo` | Hub de surf camps |
| `/5-days-surf-camp-tamarindo` | Camp 5 días |
| `/7-days-surf-camp-tamarindo` | Camp 7 días |
| `/best-surf-school-in-tamarindo` | About Us |
| `/surf-school-near-me-tamarindo` | Contacto |
| `/book-now` | Página de reservas |
| `/blog` | Blog |
| `/privacy-policy` | Política de privacidad |
| `/terms-of-use` | Términos de uso |
| `/admin` | Panel de administración (protegido) |

---

### 2. Catálogo de Servicios

Definido en `src/lib/bookingConfig.ts` (fallback local) y en la tabla `class_types` de Supabase (fuente de verdad en producción).

| ID | Nombre | Categoría | Precio/pax | Capacidad |
|---|---|---|---|---|
| `private` | Private Surf Lesson | lesson | $90 | 1 |
| `semi-private` | Semi-Private Lesson | lesson | $73 | 3 |
| `group` | Group Surf Lesson | lesson | $55 | 8 |
| `pkg-3-private` | 3-Day Private Package | package | $326 | 1 |
| `pkg-3-semi` | 3-Day Semi-Private Package | package | $326 | 10 |
| `pkg-5-private` | 5-Day Private Package | package | $621 | 1 |
| `pkg-5-semi` | 5-Day Semi-Private Package | package | $564 | 10 |
| `camp-5-days` | 5 Days Surf Camp | camp | $1,049 | 8 |
| `camp-7-private` | 7-Day Private Package | camp | $695 | 1 |
| `camp-7-semi` | 7-Day Semi-Private Package | camp | $620 | 10 |

---

### 3. Sistema de Reservas (Booking Wizard)

Ubicado en `src/components/booking/`. Es un wizard multi-paso construido en **React** que se monta en la página `/book-now`.

**Flujo de 8 pasos:**

```
1. StepClassType    → El cliente elige el tipo de servicio
2. StepDate         → Elige la fecha (mínimo 48h de anticipación)
3. StepTime         → Elige el horario disponible
4. StepParticipants → Número de personas
5. StepContact      → Nombre, email, teléfono, país, notas
6. StepCart         → Resumen del pedido (puede agregar más servicios)
7. StepPayment      → Pago con el proveedor activo (tarjeta / PayPal / on-site)
8. StepConfirmation → Confirmación final
```

**Características clave:**
- Un cliente puede reservar **múltiples servicios en un solo checkout** (multi-item cart)
- La disponibilidad se consulta en tiempo real via `GET /api/availability`
- En modo test, los bookings se confirman directamente sin pago cuando no hay proveedor de pago activo
- Los camps tienen su propio wizard: `CampBookingWizard.tsx`

---

### 4. API Routes

Todos los endpoints están en `src/pages/api/` y tienen `prerender = false` (se ejecutan en el servidor de Vercel).

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/bookings/create` | POST | Crea bookings y envía la orden al proveedor de pago activo |
| `/api/availability` | GET | Devuelve slots disponibles para una fecha y servicio |
| `/api/class-types` | GET | Lista los tipos de clase activos desde Supabase |
| `/api/payments/webhook` | POST | Recibe eventos de pago, confirma/cancela bookings |
| `/api/camp/book` | POST | Crea reservas de surf camp |
| `/api/camp/sessions` | GET | Lista sesiones de camp disponibles |
| `/api/admin/bookings` | GET | Datos para el panel admin |

---

### 5. Sistema de Disponibilidad

La disponibilidad funciona con tres capas de prioridad (de mayor a menor):

```
1. tour_slots (overrides por fecha específica)
        ↓ si no hay
2. weekly_slots (plantilla semanal por día de semana)
        ↓ si no hay
3. Sin slots disponibles ese día
```

Adicionalmente, `availability_blocks` permite bloquear fechas o slots específicos. Los slots con menos de 48 horas de anticipación se marcan automáticamente como no disponibles.

---

### 6. Sistema de Emails

Gestionado en `src/lib/emailService.ts` usando la API de **Resend**.

| Email | Destinatario | Cuándo se envía |
|---|---|---|
| Cart Summary | Cliente | Al confirmar el checkout |
| Admin Cart Summary | Admin | Al confirmar el checkout |
| Confirmation (individual) | Cliente | Por cada booking (opcional, flag `EMAIL_INDIVIDUAL_ENABLED`) |
| Admin Notification | Admin | Por cada booking (opcional) |

Los emails se envían tanto desde el webhook de pago (producción) como directamente en el endpoint de creación (modo test). Tienen un sistema de flags de entorno para activar/desactivar cada tipo:

```
EMAIL_SUMMARY_ENABLED=true        # Resumen de checkout al cliente
EMAIL_ADMIN_SUMMARY_ENABLED=true  # Resumen de checkout al admin
EMAIL_INDIVIDUAL_ENABLED=false    # Email por cada booking individual
```

---

### 7. Panel de Administración

Accesible en `/admin`. Protegido por contraseña via cookie HTTP-only (`ADMIN_PASSWORD` en `.env`). Sesión de 8 horas.

**Sección Surf Lessons & Packages:**

| Tab | Función |
|---|---|
| Bookings | Ver todas las reservas agrupadas por día, filtrar por estado/fecha, confirmar o cancelar |
| Prices & Services | Editar nombre, precio, capacidad, duración y badge de cada servicio |
| Weekly Schedule | Configurar qué días y horarios opera cada servicio de forma recurrente |
| Capacity | Sobreescribir la capacidad máxima para fechas específicas |
| Date Overrides | Sobreescribir los horarios para fechas específicas (reemplaza la plantilla semanal) |

**Sección Surf Camp:**

| Tab | Función |
|---|---|
| Camp Bookings | Ver y gestionar reservas de camp |
| Camp Rooms | Crear y editar habitaciones (nombre, cama, capacidad, amenidades, foto) |
| Camp Sessions | Crear sesiones de camp (5 o 7 días) con fechas y habitaciones asignadas |
| Camp Settings | Configurar modo de pago: pago completo o depósito (% configurable) |

---

### 8. Base de Datos (Supabase / PostgreSQL)

Schema completo en `supabase/schema.sql`.

| Tabla | Descripción |
|---|---|
| `bookings` | Reservas de lecciones y paquetes |
| `class_types` | Tipos de servicio con precios y configuración |
| `weekly_slots` | Plantilla de horarios semanales por servicio |
| `tour_slots` | Overrides de horarios para fechas específicas |
| `tour_capacity` | Overrides de capacidad para fechas específicas |
| `availability_blocks` | Bloqueos de fechas o slots |
| `camp_bookings` | Reservas de surf camps |
| `camp_rooms` | Habitaciones del camp |
| `camp_sessions` | Sesiones de camp (5 o 7 días) |
| `camp_session_rooms` | Relación sesión ↔ habitaciones |
| `camp_settings` | Configuración global del camp (modo de pago, % depósito) |

---

### 9. SEO

Cada página tiene su configuración en `src/lib/seo.ts`:
- `title` y `description` únicos
- `keyfocus` (keyword principal)
- `synonyms` y `related` (keywords secundarias)

Schemas estructurados implementados:
- `FAQSchema` — preguntas frecuentes en JSON-LD
- `BreadcrumbSchema` — migas de pan
- `ProductSchema` — datos de producto para Google

Sitemap automático generado en build (excluye `/admin`).

**Redirects 301** configurados en `astro.config.mjs` y `vercel.json` para migración desde WordPress anterior.

---

## Variables de Entorno

Archivo `.env` en la raíz del proyecto. Ver `.env.example` para la lista completa.

```env
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Payment provider
# No legacy payment gateway variables are required for this implementation.

# Resend (emails)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@puravidasurfschool.com
ADMIN_EMAIL=admin@puravidasurfschool.com

# Admin panel
ADMIN_PASSWORD=tu_password_seguro

# Flags de email (true/false)
EMAIL_SUMMARY_ENABLED=true
EMAIL_ADMIN_SUMMARY_ENABLED=true
EMAIL_INDIVIDUAL_ENABLED=false
```

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:4321)
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

---

## Deploy

El proyecto se despliega automáticamente en **Vercel** al hacer push a la rama principal. El adapter `@astrojs/vercel` convierte las rutas API en Vercel Functions. Las páginas estáticas se sirven desde el CDN global de Vercel.

**Configuración de caché en Vercel (`vercel.json`):**
- Assets estáticos (`/_astro/`, `/images/`): `max-age=31536000, immutable` (1 año)
- Rutas API: `s-maxage=300, stale-while-revalidate=600`
- Páginas: `s-maxage=3600, stale-while-revalidate=86400`

**Headers de seguridad aplicados a todas las rutas:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## Modo Test vs Producción

El sistema puede operar en modo test o con un proveedor de pago real según la configuración de pago activa:

| Condición | Comportamiento |
|---|---|
| Sin proveedor de pago activo | Bookings se confirman directamente, sin cobro real |
| Con proveedor de pago activo | Flujo completo con el proveedor de pago, la confirmación actualiza el booking |

Esto permite desarrollar y probar el flujo de reservas sin necesidad de una cuenta de pago real en producción.

---

## Curva de Aprendizaje — Por Dónde Empezar

1. **Leer `src/lib/bookingConfig.ts`** — entiende los tipos de servicio y precios
2. **Revisar `src/lib/seo.ts`** — entiende la estructura de páginas y rutas
3. **Explorar `src/pages/book-now.astro`** — ve cómo se monta el wizard
4. **Revisar `src/components/booking/BookingWizard.tsx`** — lógica del flujo de reserva
5. **Leer `src/pages/api/bookings/create.ts`** — entiende la validación y el flujo de pago
6. **Ver `supabase/schema.sql`** — estructura completa de la base de datos
7. **Abrir `/admin`** en local para explorar el panel de gestión
