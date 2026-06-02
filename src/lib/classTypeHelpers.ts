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
  /** Rows sharing the same slug render as one card with a duration step (e.g. 1h/2h). */
  variant_group?: string | null
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
  price_type?: 'per_person' | 'total' | null
  label?: string | null
}

export interface PriceBreakdown {
  total: number
  unitPrice: number
  priceType: 'per_person' | 'total'
  tier: PricingTier | null
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
      price_type: tier.price_type === 'total' ? 'total' : 'per_person',
      label: tier.label ?? null,
    }))
    .filter(tier => tier.price_per_person > 0)
    .sort((a, b) => a.min_participants - b.min_participants)
}

export function getPricePerPerson(classType: DbClassType, participants: number): number {
  return getPriceBreakdown(classType, participants).unitPrice
}

export function getPriceBreakdown(classType: DbClassType, participants: number): PriceBreakdown {
  const tiers = getPricingTiers(classType)
  const matchingTier = tiers.find(tier => {
    const max = tier.max_participants ?? Number.POSITIVE_INFINITY
    return participants >= tier.min_participants && participants <= max
  })

  if (matchingTier) {
    if (matchingTier.price_type === 'total') {
      const total = matchingTier.price_per_person
      return {
        total,
        unitPrice: participants > 0 ? total / participants : total,
        priceType: 'total',
        tier: matchingTier,
      }
    }

    return {
      total: matchingTier.price_per_person * participants,
      unitPrice: matchingTier.price_per_person,
      priceType: 'per_person',
      tier: matchingTier,
    }
  }

  const unitPrice = Number(classType.price_per_person)
  return {
    total: unitPrice * participants,
    unitPrice,
    priceType: 'per_person',
    tier: null,
  }
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
    const suffix = tier.price_type === 'total' ? ' total' : '/person'
    return `${guests}: ${formatCurrency(tier.price_per_person)}${suffix}`
  }).join(' | ')
}

export function calculateTotal(classType: DbClassType, participants: number): number {
  return getPriceBreakdown(classType, participants).total
}

export function getStartingPriceInfo(classType: DbClassType): { amount: number; suffix: string } {
  const tiers = getPricingTiers(classType)
  if (tiers.length === 0) return { amount: Number(classType.price_per_person), suffix: '/person' }

  const lowestTier = tiers.reduce((lowest, tier) => (
    tier.price_per_person < lowest.price_per_person ? tier : lowest
  ), tiers[0])

  return {
    amount: lowestTier.price_per_person,
    suffix: lowestTier.price_type === 'total' ? '/group' : '/person',
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatDuration(minutes: number): string {
  const m = Number(minutes) || 0
  if (m <= 0) return ''
  if (m % 60 === 0) {
    const h = m / 60
    return `${h} hour${h === 1 ? '' : 's'}`
  }
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export function formatTime(time: string): string {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}
