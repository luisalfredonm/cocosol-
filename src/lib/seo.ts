// SEO configuration for Cocoa Sol Surf (Cocoa Beach, FL).
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
    title: 'Surf Lessons in Cocoa Beach | Cocoa Sol Surf School',
    description:
      'Learn to surf in Cocoa Beach with certified local instructors. Small groups, all gear included & real progression. Book your surf lesson today!',
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
    title: 'Private Surf Lessons in Cocoa Beach | Cocoa Sol Surf',
    description:
      '1-on-1 private surf lessons in Cocoa Beach with a dedicated certified instructor. Fastest progression, all gear included. Book your private lesson.',
    keyfocus: 'private surf lessons cocoa beach',
    synonyms: ['1 on 1 surf lessons cocoa beach', 'private surf instructor cocoa beach'],
    related: ['couples surf lessons cocoa beach', 'family surf lessons cocoa beach'],
    ogImage: '/images/private-surf-lessons-tamarindo-one-on-one.webp',
  },

  '/group-surf-lessons-cocoa-beach': {
    title: 'Group Surf Lessons in Cocoa Beach | Cocoa Sol Surf',
    description:
      'Fun group surf lessons in Cocoa Beach with small classes and certified local instructors. All gear included -- great for friends and solo travelers.',
    keyfocus: 'group surf lessons cocoa beach',
    synonyms: ['beginner group surf lessons cocoa beach'],
    related: ['surf lessons for friends cocoa beach', 'solo traveler surf lessons cocoa beach'],
    ogImage: '/images/group-surf-lessons-tamarindo-students-beach.webp',
  },

  '/surf-coaching-cocoa-beach': {
    title: 'Surf Coaching in Cocoa Beach | Intermediate & Advanced',
    description:
      'Surf coaching in Cocoa Beach for intermediate and advanced surfers. Improve technique, wave selection and positioning with local expert coaches.',
    keyfocus: 'surf coaching cocoa beach',
    synonyms: ['advanced surf lessons cocoa beach', 'surf coach cocoa beach'],
    related: ['intermediate surf lessons cocoa beach', 'improve surfing technique florida'],
    ogImage: '/images/semi-private-surf-tamarindo-wave-riding.webp',
  },

  '/surf-camp-cocoa-beach': {
    title: 'Surf Camp in Cocoa Beach (Ages 6-16) | Cocoa Sol Surf',
    description:
      'Kids surf camp in Cocoa Beach for ages 6-16. Daily lessons, 3:1 ratio, all gear and safety briefing included. Book your summer surf camp week.',
    keyfocus: 'surf camp cocoa beach',
    synonyms: [
      'summer surf camp cocoa beach',
      'kids surf camp cocoa beach',
      'kids surf camp florida',
    ],
    related: ['family surf camp cocoa beach', 'teen surf camp florida', 'surf camp near orlando'],
    ogImage: '/images/7-days-surf-lessons-tamarindo-green-wave.webp',
  },

  '/best-surf-school-cocoa-beach': {
    title: 'Best Surf School in Cocoa Beach | About Cocoa Sol',
    description:
      'Cocoa Sol is a local surf school in Cocoa Beach, FL with 25+ years teaching. Certified, bilingual instructors and small groups. Meet the team.',
    keyfocus: 'best surf school cocoa beach',
    synonyms: ['surf schools cocoa beach', 'top surf school cocoa beach'],
    related: ['certified surf instructors cocoa beach', 'bilingual surf instructors florida'],
    ogImage: '/images/surf-school-tamarindo-surf-instructor-student.webp',
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
    title: 'Book Surf Lessons in Cocoa Beach | Cocoa Sol Surf',
    description:
      'Book your surf lesson, package or camp in Cocoa Beach online. Pick your date and time and secure your spot in seconds. All gear included.',
    keyfocus: 'book surf lessons cocoa beach',
    synonyms: ['surf lesson booking cocoa beach'],
    related: ['surf lesson prices cocoa beach', 'surf packages cocoa beach'],
    ogImage: '/images/surf-school-tamarindo-beginner-lesson.webp',
  },
}

const FALLBACK_SEO: PageSEO = {
  title: 'Cocoa Sol Surf School | Surf Lessons in Cocoa Beach',
  description:
    'Certified local surf instructors in Cocoa Beach, FL. Small groups, all gear included and real progression for every level.',
  keyfocus: 'surf lessons cocoa beach',
  synonyms: [],
  related: [],
  ogImage: '/images/surf-school-tamarindo-surf-instructor-student.webp',
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
  surfCamp: withRoute('/surf-camp-cocoa-beach'),
  aboutUs: withRoute('/best-surf-school-cocoa-beach'),
  bookNow: withRoute('/book-now'),

  surfLessons: withRoute('/'),
  surfPrices: withRoute('/surf-packages-cocoa-beach', {
    title: 'Surf Lesson Prices & Packages in Cocoa Beach | Cocoa Sol Surf',
    description:
      'Transparent surf lesson prices in Cocoa Beach. Private, group and multi-session packages available. All gear included with no hidden fees.',
    keyfocus: 'surf lesson prices cocoa beach',
    synonyms: ['surf packages cocoa beach', 'surf lesson cost cocoa beach'],
    related: ['private surf lessons cocoa beach', 'group surf lessons cocoa beach'],
    ogImage: '/images/surf-school-tamarindo-beginner-lesson.webp',
  }),
  kidsSurfLessons: withRoute('/kids-surf-lessons-cocoa-beach', {
    title: 'Kids Surf Lessons in Cocoa Beach | Cocoa Sol Surf',
    description:
      'Safe kids surf lessons in Cocoa Beach with certified instructors, small ratios and all gear included. Beginner-friendly for young surfers.',
    keyfocus: 'kids surf lessons cocoa beach',
    synonyms: ['children surf lessons cocoa beach', 'surf lessons for kids cocoa beach'],
    related: ['kids surf camp cocoa beach', 'beginner surf lessons cocoa beach'],
    ogImage: '/images/7-days-surf-lessons-tamarindo-green-wave.webp',
  }),
  blog: withRoute('/blog', {
    title: 'Cocoa Beach Surf Blog | Cocoa Sol Surf School',
    description:
      'Read Cocoa Beach surf tips, beginner guides, family surfing advice and local planning resources from Cocoa Sol Surf School.',
    keyfocus: 'cocoa beach surf blog',
    synonyms: ['cocoa beach surfing guide', 'surf tips cocoa beach'],
    related: ['surf lessons cocoa beach', 'surf camp cocoa beach'],
    ogImage: '/images/hero-home.jpg',
  }),

  // Legacy blog metadata retained so existing Tamarindo blog pages keep building.
  bestTimeSurf: withRoute('/blog/best-time-to-surf-tamarindo', {
    title: 'Best Time to Surf in Tamarindo | Month-by-Month Guide',
    description:
      'Discover the best time to surf in Tamarindo, Costa Rica with a month-by-month breakdown of swell, wind and crowd conditions.',
    keyfocus: 'best time to surf tamarindo',
    synonyms: ['tamarindo surf season', 'when to surf tamarindo'],
    related: ['surf lessons tamarindo', 'surf camp tamarindo'],
  }),
  firstSurfLesson: withRoute('/blog/what-to-expect-first-surf-lesson-tamarindo', {
    title: 'What to Expect on Your First Surf Lesson in Tamarindo',
    description:
      'Nervous about your first surf lesson in Tamarindo? See what happens from arrival to catching your first wave. No experience needed.',
    keyfocus: 'first surf lesson tamarindo',
    synonyms: ['beginner surf lesson tamarindo', 'first time surfing tamarindo'],
    related: ['private surf lessons tamarindo', 'group surf lessons tamarindo'],
  }),
  familySurfLessons: withRoute('/family-surf-lessons-tamarindo', {
    title: 'Family Surf Lessons Tamarindo | Surf with Your Kids',
    description:
      'Fun and safe family surf lessons in Tamarindo for kids and adults with certified instructors and patient coaching.',
    keyfocus: 'family surf lessons tamarindo',
    synonyms: ['surf lessons for families tamarindo', 'kids surf lessons tamarindo'],
    related: ['group surf lessons tamarindo', 'beginner surf lessons tamarindo'],
  }),
  sanJoseToTamarindo: withRoute('/blog/how-to-get-from-san-jose-to-tamarindo', {
    title: 'How to Get from San Jose to Tamarindo | Transport Guide',
    description:
      'Compare shuttle, rental car and bus options from San Jose to Tamarindo with times, costs and local travel tips.',
    keyfocus: 'how to get from san jose to tamarindo',
    synonyms: ['san jose to tamarindo', 'tamarindo transportation'],
    related: ['tamarindo surf lessons', 'tamarindo travel guide'],
  }),
  tamarindoVsJaco: withRoute('/blog/tamarindo-vs-jaco-surf-beginners', {
    title: 'Tamarindo vs Jaco for Beginner Surfers | Which Is Better?',
    description:
      'Tamarindo or Jaco? Compare both surf destinations for beginner surfers by waves, crowds, infrastructure and vibe.',
    keyfocus: 'tamarindo vs jaco surf',
    synonyms: ['tamarindo vs jaco surfing', 'best beginner surf spot costa rica'],
    related: ['tamarindo surf lessons', 'private surf lessons tamarindo'],
  }),
  packingList: withRoute('/blog/surf-trip-costa-rica-packing-list', {
    title: 'Surf Trip Packing List: What to Bring to Costa Rica',
    description:
      'A complete packing list for a surf trip to Costa Rica, including gear, clothing and documents for Tamarindo.',
    keyfocus: 'surf trip costa rica packing list',
    synonyms: ['what to pack for surf trip costa rica', 'costa rica surf packing list'],
    related: ['tamarindo surf lessons', 'surf camp tamarindo'],
  }),
  isTamarindoGoodForBeginners: withRoute('/blog/is-tamarindo-good-for-beginner-surfers', {
    title: 'Is Tamarindo Good for Beginner Surfers? | Local Guide',
    description:
      'Wondering if Tamarindo is right for learning to surf? Learn about the waves, conditions and beginner-friendly spots.',
    keyfocus: 'is tamarindo good for beginner surfers',
    synonyms: ['tamarindo beginner surf', 'learn to surf tamarindo'],
    related: ['group surf lessons tamarindo', 'private surf lessons tamarindo'],
  }),
  surfingWithKids: withRoute('/blog/surfing-with-kids-tamarindo', {
    title: 'Surfing with Kids in Tamarindo | Family Surf Guide',
    description:
      'What parents need to know about surfing with kids in Tamarindo, including age, safety, gear and family lesson tips.',
    keyfocus: 'surfing with kids tamarindo',
    synonyms: ['kids surfing tamarindo', 'family surf costa rica'],
    related: ['family surf lessons tamarindo', 'surf camp tamarindo'],
  }),
  whatIsSurfCamp: withRoute('/blog/what-is-a-surf-camp', {
    title: 'What Is a Surf Camp? Everything You Need to Know',
    description:
      'Learn what a surf camp is, what to expect, who it is for and how it compares with regular surf lessons.',
    keyfocus: 'what is a surf camp',
    synonyms: ['surf camp explained', 'surf camp vs surf lessons'],
    related: ['surf camp cocoa beach', 'beginner surf camp'],
  }),
}

export const ROUTES = {
  HOME: '/',
  SURF_LESSONS: '/',
  PRIVATE: '/private-surf-lessons-cocoa-beach',
  SEMI_PRIVATE: '/surf-coaching-cocoa-beach',
  GROUP: '/group-surf-lessons-cocoa-beach',
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
