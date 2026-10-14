// SEO configuration for Cocosol Surf Lessons (Cocoa Beach, FL).
// One canonical keyword intent per route to avoid cannibalization:
// - "surf lessons" (and "surfing lessons") live on the home page.
// - "surf school" + "best surf school" live on /best-surf-school-cocoa-beach
//   (GSC jun-oct 2026: that page ranks ~11.6 for them; the home sat at 25-30).
//   The home links there with a "surf school" anchor instead of competing.
// - "surf camp" + "summer surf camp" live on /surf-camp-cocoa-beach.
// - "surf lessons near me" is handled through GBP, LocalBusiness schema,
//   and consistent NAP instead of a dedicated landing page.

export interface PageSEO {
  title: string
  description: string
  keyfocus: string
  synonyms: string[]
  related: string[]
  ogImage?: string
}

export interface PageSEOWithRoute extends PageSEO {
  slug: string
  image?: string
}

export const SEO: Record<string, PageSEO> = {
  '/': {
    // "Florida" y el gerundio "surfing lessons" cubren 3 keywords cada uno
    // (2.290 y 2.490 de volumen) que la home ya rankeaba en pos. 18-28 sin
    // contener ninguna de las dos frases. Ver H1 en index.astro y H2 en
    // LessonsGrid.astro, que sostienen las mismas variantes.
    title: 'Surf Lessons in Cocoa Beach, Florida | Cocosol Surf Lessons',
    description:
      'Surf lessons in Cocoa Beach, Florida from $60. Certified local instructors, small groups and all gear included. Rated 4.9 on Google. Book online today!',
    keyfocus: 'surf lessons cocoa beach',
    synonyms: [
      'surfing lessons cocoa beach',
      'cocoa beach florida surfing lessons',
      'cocoa beach surf lessons',
      'surf lessons cocoa beach fl',
      'surfing lessons cocoa beach fl',
      'cocoa beach pier surf lessons',
    ],
    related: [
      'certified surf instructors cocoa beach',
      'learn to surf cocoa beach',
      'best place to learn to surf in florida',
    ],
    ogImage: '/images/hero-home.jpg',
  },

  '/private-surf-lessons-cocoa-beach': {
    // GSC (jun-sep 2026): 404 impresiones, 0 clics en pos. 24. Precio y
    // rating en el snippet para diferenciarse de los listados de la página 2-3.
    title: 'Private Surf Lessons in Cocoa Beach | 1-on-1 From $75',
    description:
      'One-on-one surf lessons in Cocoa Beach with your own certified instructor. The fastest way to stand up and progress, all gear included. Rated 4.9 on Google.',
    keyfocus: 'private surf lessons cocoa beach',
    synonyms: ['1 on 1 surf lessons cocoa beach', 'private surf instructor cocoa beach'],
    related: ['couples surf lessons cocoa beach', 'family surf lessons cocoa beach'],
    ogImage: '/images/private-surf-lessons-cocoa-beach-one-on-one.webp',
  },

  '/group-surf-lessons-cocoa-beach': {
    // GSC (jun-oct 2026): 642 impresiones, 3 clics, pos. 22. Precio en el
    // título para diferenciarse; la posición es el problema real (contenido/enlaces).
    title: 'Group Surf Lessons in Cocoa Beach | From $60 Per Person',
    description:
      'Group surf lessons in Cocoa Beach from $60. Small classes, certified local instructors and all gear included. Great for friends, families and solo travelers.',
    keyfocus: 'group surf lessons cocoa beach',
    synonyms: ['beginner group surf lessons cocoa beach'],
    related: ['surf lessons for friends cocoa beach', 'solo traveler surf lessons cocoa beach'],
    ogImage: '/images/group-surf-lessons-cocoa-beach-students-beach.webp',
  },

  '/surf-coaching-cocoa-beach': {
    title: 'Surf Coaching in Cocoa Beach, FL | From $75 per Session',
    description:
      'Surf coaching in Cocoa Beach for intermediate and advanced surfers from $75. Improve technique, wave selection and positioning with local expert coaches.',
    keyfocus: 'surf coaching cocoa beach',
    synonyms: ['advanced surf lessons cocoa beach', 'surf coach cocoa beach'],
    related: ['intermediate surf lessons cocoa beach', 'improve surfing technique florida'],
    ogImage: '/images/semi-private-surf-cocoa-beach-wave-riding.webp',
  },

  '/surf-camp-cocoa-beach': {
    title: 'Surf Camp in Cocoa Beach (Ages 6-16) | $350 per Week',
    description:
      'Kids surf camp in Cocoa Beach for ages 6-16, $350 per week. Daily lessons, 3:1 ratio, all gear and safety briefing included. Reserve your summer camp week.',
    keyfocus: 'surf camp cocoa beach',
    synonyms: [
      'summer surf camp cocoa beach',
      'kids surf camp cocoa beach',
      'kids surf camp florida',
    ],
    related: ['family surf camp cocoa beach', 'teen surf camp florida', 'surf camp near orlando'],
    ogImage: '/images/7-days-surf-lessons-cocoa-beach-green-wave.webp',
  },

  '/surf-training-schedule-cocoa-beach': {
    title: 'Weekly Surf Training Schedule in Cocoa Beach | Cocosol',
    description:
      'See the Cocosol weekly surf training schedule in Cocoa Beach: daily surf, surfskate and Indo Board sessions, plus Saturday competition and video analysis.',
    keyfocus: 'surf training schedule cocoa beach',
    synonyms: [
      'surf coaching schedule cocoa beach',
      'weekly surf training cocoa beach',
      'surfskate training cocoa beach',
      'indo board training cocoa beach',
    ],
    related: [
      'surf coaching cocoa beach',
      'advanced surf training florida',
      'surf competition training cocoa beach',
    ],
    ogImage: '/images/semi-private-surf-cocoa-beach-wave-riding.webp',
  },

  '/best-surf-school-cocoa-beach': {
    // GSC (jun-oct 2026): 362 impresiones, 7 clics, pos. 11.6. Es la página
    // que rankea mejor para "surf school"; la home deja de competir por esa
    // keyword. "cocoa beach surf school" (pos. 30) y "surf school cocoa beach"
    // (pos. 25) se mueven aquí desde la home.
    title: 'Best Surf School in Cocoa Beach | Rated 4.9 on Google',
    description:
      'Cocosol is a family-run surf school in Cocoa Beach, FL. ISA-certified bilingual instructors, max 3:1 groups and 25+ years of teaching experience.',
    keyfocus: 'best surf school cocoa beach',
    synonyms: [
      'surf school cocoa beach',
      'cocoa beach surf school',
      'surf schools cocoa beach',
      'top surf school cocoa beach',
    ],
    related: ['certified surf instructors cocoa beach', 'bilingual surf instructors florida'],
    ogImage: '/images/surf-school-cocoa-beach-surf-instructor-student.webp',
  },

  '/surf-lessons-near-orlando': {
    // GSC (jun-oct 2026): 1.069 impresiones, 11 clics (1%), pos. 15. Distancia
    // y precio en el snippet responden la duda del turista de Orlando.
    title: 'Surf Lessons Near Orlando | Just 1 Hour Away in Cocoa Beach',
    description:
      'Staying in Orlando? Take a surf lesson just 60 minutes away in Cocoa Beach. Beginner-friendly waves, certified instructors and all gear included. From $60.',
    keyfocus: 'surf lessons near orlando',
    synonyms: ['surf lessons near kennedy space center', 'surf lessons space coast'],
    related: ['things to do near orlando beaches', 'surf lessons near disney'],
    ogImage: '/images/hero-home.jpg',
  },

  '/book-now': {
    title: 'Book Surf Lessons in Cocoa Beach | Cocosol Surf Lessons',
    description:
      'Book your surf lesson, package or camp in Cocoa Beach online. Pick your date and time and secure your spot in seconds. All gear included.',
    keyfocus: 'book surf lessons cocoa beach',
    synonyms: ['surf lesson booking cocoa beach'],
    related: ['surf lesson prices cocoa beach', 'surf packages cocoa beach'],
    ogImage: '/images/surf-school-cocoa-beach-beginner-lesson.webp',
  },
}

const FALLBACK_SEO: PageSEO = {
  title: 'Cocosol Surf Lessons | Surf Lessons in Cocoa Beach',
  description:
    'Certified local surf instructors in Cocoa Beach, FL. Small groups, all gear included and real progression for every level.',
  keyfocus: 'surf lessons cocoa beach',
  synonyms: [],
  related: [],
  ogImage: '/images/surf-school-cocoa-beach-surf-instructor-student.webp',
}

const withRoute = (path: string, overrides: Partial<PageSEO> = {}): PageSEOWithRoute => {
  const seo = { ...(SEO[path] ?? FALLBACK_SEO), ...overrides }

  return {
    ...seo,
    slug: path,
    image: seo.ogImage,
  }
}

// Backward-compatible map for existing Astro pages.
export const seoData: Record<string, PageSEOWithRoute> = {
  home: withRoute('/'),
  privateLessons: withRoute('/private-surf-lessons-cocoa-beach'),
  groupLessons: withRoute('/group-surf-lessons-cocoa-beach'),
  semiPrivateLessons: withRoute('/surf-coaching-cocoa-beach'),
  trainingSchedule: withRoute('/surf-training-schedule-cocoa-beach'),
  surfCamp: withRoute('/surf-camp-cocoa-beach'),
  aboutUs: withRoute('/best-surf-school-cocoa-beach'),
  bookNow: withRoute('/book-now'),

  surfLessons: withRoute('/'),
  surfLessonsNearOrlando: withRoute('/surf-lessons-near-orlando'),
  surfPrices: withRoute('/surf-packages-cocoa-beach', {
    title: 'Surf Lesson Prices in Cocoa Beach | Packages From $260',
    description:
      'Surf lesson prices in Cocoa Beach: group from $60, private from $75, multi-session packages from $260. All gear included, no hidden fees.',
    keyfocus: 'surf lesson prices cocoa beach',
    synonyms: ['surf packages cocoa beach', 'surf lesson cost cocoa beach'],
    related: ['private surf lessons cocoa beach', 'group surf lessons cocoa beach'],
    ogImage: '/images/surf-school-cocoa-beach-beginner-lesson.webp',
  }),
  kidsSurfLessons: withRoute('/kids-surf-lessons-cocoa-beach', {
    // GSC (jun-sep 2026): "cocoa beach surf lessons for kids" en pos. 8.6 con
    // 0 clics. Edad, ratio y precio son lo que un padre compara en el snippet.
    title: 'Kids Surf Lessons in Cocoa Beach (Ages 6-16) | From $60',
    description:
      'Kids surf lessons in Cocoa Beach for ages 6-16. Max 3 kids per certified instructor, all gear and a safety briefing included. Group from $60, private $75.',
    keyfocus: 'kids surf lessons cocoa beach',
    synonyms: ['children surf lessons cocoa beach', 'surf lessons for kids cocoa beach'],
    related: ['kids surf camp cocoa beach', 'beginner surf lessons cocoa beach'],
    ogImage: '/images/7-days-surf-lessons-cocoa-beach-green-wave.webp',
  }),
  blog: withRoute('/blog', {
    title: 'Cocoa Beach Surf Blog | Cocosol Surf Lessons',
    description:
      'Read Cocoa Beach surf tips, beginner guides, family surfing advice and local planning resources from Cocosol Surf Lessons.',
    keyfocus: 'cocoa beach surf blog',
    synonyms: ['cocoa beach surfing guide', 'surf tips cocoa beach'],
    related: ['surf lessons cocoa beach', 'surf camp cocoa beach'],
    ogImage: '/images/hero-home.jpg',
  }),
  // Los posts del blog definen su SEO dentro de su propio .astro (title,
  // description, FAQs y fechas juntos), así que no se duplican aquí.
}

export const ROUTES = {
  HOME: '/',
  SURF_LESSONS: '/',
  PRIVATE: '/private-surf-lessons-cocoa-beach',
  SEMI_PRIVATE: '/surf-coaching-cocoa-beach',
  TRAINING_SCHEDULE: '/surf-training-schedule-cocoa-beach',
  GROUP: '/group-surf-lessons-cocoa-beach',
  NEAR_ORLANDO: '/surf-lessons-near-orlando',
  PACKAGES: '/surf-packages-cocoa-beach',
  CAMP: '/surf-camp-cocoa-beach',
  KIDS: '/kids-surf-lessons-cocoa-beach',
  PRICES: '/surf-packages-cocoa-beach',
  ABOUT: '/best-surf-school-cocoa-beach',
  CONTACT: '/contact',
  BOOK: '/book-now',
}

// Perfiles externos. Se centralizan aquí porque Testimonials se monta en 8+
// páginas: hardcodear la URL en el componente la volvería imposible de
// actualizar si cambia el listado de Google Business Profile.
export const EXTERNAL = {
  GOOGLE_REVIEWS: 'https://maps.app.goo.gl/aqtghU2a2YSEFjf96',
}

// ── Contacto ────────────────────────────────────────────────────────────────
// El teléfono aparecía literal en 47 sitios y en seis formatos distintos
// (wa.me, tel:, texto visible, schema, prop de componente, plantillas de
// email). Cambiar de número obligaba a encontrarlos todos a mano.
//
// DIGITS es la única fuente de verdad; el resto se deriva. DISPLAY se escribe
// aparte porque formatear un E.164 a formato local requiere un formateador, y
// no vale la pena arrastrar uno solo para esto.
const PHONE_DIGITS = '13213869993'

export const CONTACT = {
  /** Solo dígitos, sin '+'. Para props que construyen su propia URL. */
  DIGITS: PHONE_DIGITS,
  /** E.164, el formato que espera schema.org telephone. */
  E164: `+${PHONE_DIGITS}`,
  TEL_HREF: `tel:+${PHONE_DIGITS}`,
  WHATSAPP_URL: `https://wa.me/${PHONE_DIGITS}`,
  /** Texto visible, formato local US. */
  DISPLAY: '(321) 386-9993',
  /** Texto visible con prefijo de país. */
  DISPLAY_INTL: '+1 (321) 386-9993',
}

export function getSEO(path: string): PageSEO {
  return SEO[path] ?? FALLBACK_SEO
}
