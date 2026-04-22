// Pure client-safe helpers — no Supabase imports

export interface DbClassType {
  id: string
  name: string
  category: 'lesson' | 'package' | 'camp'
  price_per_person: number
  max_capacity: number
  min_participants_per_booking?: number | null
  max_participants_per_booking?: number | null
  duration_minutes: number
  description: string
  included: string[]
  badge: string | null
  active: boolean
  sort_order: number
}

export function getMinParticipants(classType: DbClassType): number {
  const min = classType.min_participants_per_booking ?? 1
  return Math.max(1, min)
}

export function getMaxParticipants(classType: DbClassType): number {
  const min = getMinParticipants(classType)
  const max = classType.max_participants_per_booking ?? classType.max_capacity ?? min
  return Math.max(min, max)
}

export function calculateTotal(classType: DbClassType, participants: number): number {
  return classType.price_per_person * participants
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatTime(time: string): string {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}
