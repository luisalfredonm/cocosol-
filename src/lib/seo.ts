// SEO configuration for Cocosol Surf Lessons (Cocoa Beach, FL).
// One canonical keyword intent per route to avoid cannibalization:
// - "surf lessons" + "surf school cocoa beach" live on the home page.
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
      'Learn to surf in Cocoa Beach, Florida with certified local instructors. Small-group surfing lessons, all gear included and real progression. Book today!',
    keyfocus: 'surf lessons cocoa beach',
    synonyms: [
      'surf school cocoa beach',
      'surfing lessons cocoa beach',
      'cocoa beach florida surfing lessons',
      'cocoa beach surf lessons',
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
    title: 'Private Surf Lessons in Cocoa Beach | Cocosol Surf Lessons',
    description:
      '1-on-1 private surf lessons in Cocoa Beach with a dedicated certified instructor. Fastest progression, all gear included. Book your private lesson.',
    keyfocus: 'private surf lessons cocoa beach',
    synonyms: ['1 on 1 surf lessons cocoa beach', 'private surf instructor cocoa beach'],
    related: ['couples surf lessons cocoa beach', 'family surf lessons cocoa beach'],
    ogImage: '/images/private-surf-lessons-cocoa-beach-one-on-one.webp',
  },

  '/group-surf-lessons-cocoa-beach': {
    title: 'Group Surf Lessons in Cocoa Beach | Cocosol Surf Lessons',
    description:
      'Fun group surf lessons in Cocoa Beach with small classes and certified local instructors. All gear included -- great for friends and solo travelers.',
    keyfocus: 'group surf lessons cocoa beach',
    synonyms: ['beginner group surf lessons cocoa beach'],
    related: ['surf lessons for friends cocoa beach', 'solo traveler surf lessons cocoa beach'],
    ogImage: '/images/group-surf-lessons-cocoa-beach-students-beach.webp',
  },

  '/surf-coaching-cocoa-beach': {
    title: 'Surf Coaching in Cocoa Beach | Intermediate & Advanced',
    description:
      'Surf coaching in Cocoa Beach for intermediate and advanced surfers. Improve technique, wave selection and positioning with local expert coaches.',
    keyfocus: 'surf coaching cocoa beach',
    synonyms: ['advanced surf lessons cocoa beach', 'surf coach cocoa beach'],
    related: ['intermediate surf lessons cocoa beach', 'improve surfing technique florida'],
    ogImage: '/images/semi-private-surf-cocoa-beach-wave-riding.webp',
  },

  '/surf-camp-cocoa-beach': {
    title: 'Surf Camp in Cocoa Beach (Ages 6-16) | Cocosol Surf Lessons',
    description:
      'Kids surf camp in Cocoa Beach for ages 6-16. Daily lessons, 3:1 ratio, all gear and safety briefing included. Book your summer surf camp week.',
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
    title: 'Best Surf School in Cocoa Beach | About Cocosol',
    description:
      'Cocosol is a local surf school in Cocoa Beach, FL with 25+ years teaching. Certified, bilingual instructors and small groups. Meet the team.',
    keyfocus: 'best surf school cocoa beach',
    synonyms: ['surf schools cocoa beach', 'top surf school cocoa beach'],
    related: ['certified surf instructors cocoa beach', 'bilingual surf instructors florida'],
    ogImage: '/images/surf-school-cocoa-beach-surf-instructor-student.webp',
  },

  '/surf-lessons-near-orlando': {
    title: 'Surf Lessons Near Orlando | Cocoa Beach Surf School',
    description:
      'Visiting Orlando? Learn to surf an hour away in Cocoa Beach. Certified instructors, beginner-friendly waves, all gear included. Book your lesson.',
    keyfocus: 'surf lessons near orlando',
    synonyms: ['surf lessons near kennedy space center', 'surf lessons space coast'],
    related: ['things to do near orlando beaches', 'surf lessons near disney'],
    ogImage: '/images/hero-home.jpg',
  },

  '/surfing-cocoa-beach': {
    title: 'Surfing in Cocoa Beach: Is It Good for Surfing? | Guide',
    description:
      'Is Cocoa Beach good for surfing? A local guide to waves, best times, beginner spots and what to expect, plus where to take your first lesson.',
    keyfocus: 'is cocoa beach good for surfing',
    synonyms: ['surfing in cocoa beach', 'cocoa beach surf'],
    related: [
      'best time to surf cocoa beach',
      'cocoa beach surf report beginners',
      'where to surf in cocoa beach',
    ],
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
    title: 'Surf Lesson Prices & Packages in Cocoa Beach | Cocosol',
    description:
      'Transparent surf lesson prices in Cocoa Beach. Private, group and multi-session packages available. All gear included with no hidden fees.',
    keyfocus: 'surf lesson prices cocoa beach',
    synonyms: ['surf packages cocoa beach', 'surf lesson cost cocoa beach'],
    related: ['private surf lessons cocoa beach', 'group surf lessons cocoa beach'],
    ogImage: '/images/surf-school-cocoa-beach-beginner-lesson.webp',
  }),
  kidsSurfLessons: withRoute('/kids-surf-lessons-cocoa-beach', {
    title: 'Kids Surf Lessons in Cocoa Beach | Cocosol Surf Lessons',
    description:
      'Safe kids surf lessons in Cocoa Beach with certified instructors, small ratios and all gear included. Beginner-friendly for young surfers.',
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
  isCocoaBeachGoodForSurfing: withRoute('/blog/is-cocoa-beach-good-for-surfing', {
    title: 'Is Cocoa Beach Good for Surfing? A Local Guide',
    description:
      'The honest breakdown on Cocoa Beach surf conditions, best times of year, beginner spots and what local instructors say about Florida\'s most surf-friendly coast.',
    keyfocus: 'is cocoa beach good for surfing',
    synonyms: ['cocoa beach surf conditions', 'surfing in cocoa beach', 'cocoa beach waves for beginners'],
    related: ['surf lessons cocoa beach', 'best time to surf cocoa beach'],
    ogImage: '/images/surf-school-cocoa-beach-surf-instructor-student.webp',
  }),
  beginnersGuideToSurfing: withRoute('/blog/beginners-guide-to-surfing', {
    title: "The Complete Beginner's Guide to Surfing",
    description:
      'Everything you need to know before you get in the water — the pop-up, gear, the 5 mistakes beginners make, and why a lesson beats trying it alone every time.',
    keyfocus: 'beginners guide to surfing',
    synonyms: ['how to start surfing', 'learn to surf guide', 'surfing for beginners'],
    related: ['surf lessons cocoa beach', 'private surf lessons cocoa beach'],
    ogImage: '/images/surf-school-cocoa-beach-beginner-lesson.webp',
  }),
  surfingNearOrlando: withRoute('/blog/surfing-near-orlando', {
    title: 'Surfing Near Orlando — Best Spots & How to Get There',
    description:
      'Cocoa Beach is just 60 minutes from Orlando. Here\'s how to add a surf lesson to your Central Florida trip — without losing a full day to travel.',
    keyfocus: 'surfing near orlando',
    synonyms: ['surf lessons near orlando', 'surf near orlando florida', 'cocoa beach from orlando'],
    related: ['surf lessons cocoa beach', 'things to do near orlando'],
    ogImage: '/images/surf-school-cocoa-beach-students.webp',
  }),
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

export function getSEO(path: string): PageSEO {
  return SEO[path] ?? FALLBACK_SEO
}
