export type ClassTypeId =
  | 'private'
  | 'semi-private'
  | 'group'
  | 'pkg-3-days'
  | 'pkg-5-days'

export type Category = 'lesson' | 'package' | 'camp'

export interface ClassType {
  id: ClassTypeId
  name: string
  category: Category
  pricePerPerson: number
  maxCapacity: number
  durationMinutes: number
  description: string
  included: string[]
  defaultSlots: string[] // HH:mm
  badge?: string
}

export const CLASS_TYPES: Record<ClassTypeId, ClassType> = {
  'private': {
    id: 'private',
    name: 'Private Surf Lesson',
    category: 'lesson',
    pricePerPerson: 90,
    maxCapacity: 1,
    durationMinutes: 90,
    description: 'One-on-one personalized coaching. Fastest progression, any skill level.',
    included: ['Surfboard', 'Leash', 'Rash guard', 'Certified instructor', 'Photos'],
    defaultSlots: ['07:00', '09:00', '11:00', '13:00', '15:00'],
  },
  'semi-private': {
    id: 'semi-private',
    name: 'Semi-Private Lesson',
    category: 'lesson',
    pricePerPerson: 50,
    maxCapacity: 3,
    durationMinutes: 90,
    description: 'Small group of 2–3 people. Perfect for couples and friends.',
    included: ['Surfboard', 'Leash', 'Rash guard', 'Certified instructor', 'Photos'],
    defaultSlots: ['07:00', '09:00', '11:00', '13:00', '15:00'],
  },
  'group': {
    id: 'group',
    name: 'Group Surf Lesson',
    category: 'lesson',
    pricePerPerson: 50,
    maxCapacity: 8,
    durationMinutes: 90,
    description: 'Fun group setting, ideal for beginners and solo travelers.',
    included: ['Surfboard', 'Leash', 'Rash guard', 'Certified instructor'],
    defaultSlots: ['08:00', '10:00', '12:00', '14:00'],
    badge: 'Most Popular',
  },
  'pkg-3-days': {
    id: 'pkg-3-days',
    name: '3 Days Surf Package',
    category: 'package',
    pricePerPerson: 245,
    maxCapacity: 6,
    durationMinutes: 90,
    description: '3 surf lessons spread across 3 days plus one boat surf trip.',
    included: ['3 x 90-min lessons', '1 surf trip', 'Surfboard & gear', 'Certified instructor', 'Photos'],
    defaultSlots: ['07:00', '09:00'],
  },
  'pkg-5-days': {
    id: 'pkg-5-days',
    name: '5 Days Surf Package',
    category: 'package',
    pricePerPerson: 405,
    maxCapacity: 6,
    durationMinutes: 90,
    description: '4 surf lessons over 5 days plus a surf trip. Our most popular package.',
    included: ['4 x 90-min lessons', '1 surf trip', 'Surfboard & gear', 'Certified instructor', 'Photos'],
    defaultSlots: ['07:00', '09:00'],
    badge: 'Best Value',
  },
}

export const CATEGORY_LABELS: Record<Category, string> = {
  lesson: 'Surf Lessons',
  package: 'Surf Packages',
  camp: 'Surf Camps',
}

export function calculateTotal(classTypeId: ClassTypeId, participants: number): number {
  return CLASS_TYPES[classTypeId].pricePerPerson * participants
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
