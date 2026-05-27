// Pure client-safe helpers — no Supabase imports

export interface DbClassType {
  id: string
  name: string
  category: 'lesson' | 'package' | 'camp'
  price_per_person: number
  price_tiers?: PricingTier[] | null
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

export interface PricingTier {
  min_participants: number
  max_participants?: number | null
  price_per_person: number
  label?: string | null
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

export function getPricingTiers(classType: DbClassType): PricingTier[] {
  if (!Array.isArray(classType.price_tiers)) return []

  return classType.price_tiers
    .map(tier => ({
      min_participants: Math.max(1, Number(tier.min_participants) || 1),
      max_participants:
        tier.max_participants === null || tier.max_participants === undefined
          ? null
          : Math.max(1, Number(tier.max_participants) || 1),
      price_per_person: Math.max(0, Number(tier.price_per_person) || 0),
      label: tier.label ?? null,
    }))
    .filter(tier => tier.price_per_person > 0)
    .sort((a, b) => a.min_participants - b.min_participants)
}

export function getPricePerPerson(classType: DbClassType, participants: number): number {
  const tiers = getPricingTiers(classType)
  const matchingTier = tiers.find(tier => {
    const max = tier.max_participants ?? Number.POSITIVE_INFINITY
    return participants >= tier.min_participants && participants <= max
  })

  return matchingTier?.price_per_person ?? Number(classType.price_per_person)
}

export function formatPricingTiers(classType: DbClassType): string {
  const tiers = getPricingTiers(classType)
  if (tiers.length === 0) return `${formatCurrency(Number(classType.price_per_person))}/person`

  return tiers.map(tier => {
    const max = tier.max_participants
    const guests = max && max !== tier.min_participants
      ? `${tier.min_participants}-${max}`
      : max === tier.min_participants
        ? `${tier.min_participants}`
        : `${tier.min_participants}+`
    return `${guests}: ${formatCurrency(tier.price_per_person)}`
  }).join(' | ')
}

export function calculateTotal(classType: DbClassType, participants: number): number {
  return getPricePerPerson(classType, participants) * participants
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
