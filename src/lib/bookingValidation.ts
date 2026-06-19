import { supabase } from './supabase'
import { getClassTypes, calculateTotal } from './classTypes'
import { getMinParticipants, getMaxParticipants } from './classTypeHelpers'

/**
 * How long an unpaid `pending` booking keeps holding a slot's capacity.
 * Past this window it is treated as abandoned and no longer blocks the slot,
 * so a stale/ghost reservation can never permanently lock a time.
 */
export const PENDING_HOLD_MS = 60 * 60 * 1000 // 60 minutes

/** A booking counts toward capacity if it's confirmed, or pending but recent. */
export function holdsCapacity(booking: { status?: string; created_at?: string }): boolean {
  if (booking.status === 'confirmed') return true
  if (booking.status !== 'pending') return false
  const createdMs = booking.created_at ? new Date(booking.created_at).getTime() : 0
  return Number.isFinite(createdMs) && Date.now() - createdMs < PENDING_HOLD_MS
}

export interface NormalizedContact {
  name: string
  email: string
  phone: string
  country: string
  notes: string
}

export interface NormalizedBookingItem {
  classTypeId: string
  date: string
  timeSlot: string
  participants: number
  totalAmount: number
}

export interface ValidationSuccess {
  ok: true
  contact: NormalizedContact
  normalizedItems: NormalizedBookingItem[]
  totalAmount: number
  classTypeMap: Map<string, any>
}

export interface ValidationFailure {
  ok: false
  error: string
  status: number
}

export type ValidationResult = ValidationSuccess | ValidationFailure

interface RawBookingItem {
  classTypeId?: unknown
  date?: unknown
  timeSlot?: unknown
  participants?: unknown
}

function getRawItems(body: any): RawBookingItem[] {
  if (Array.isArray(body?.items)) return body.items
  return [{
    classTypeId: body?.classTypeId,
    date: body?.date,
    timeSlot: body?.timeSlot,
    participants: body?.participants,
  }]
}

/**
 * Validates and normalizes a booking request (contact + items), re-checking
 * availability and capacity against the database. Shared by the booking
 * creation handler and the atomic Square checkout handler so both paths apply
 * identical rules. Does NOT write anything.
 */
export async function validateBooking(body: any): Promise<ValidationResult> {
  const contact = body?.contact
  if (!contact?.name || !contact?.email) return { ok: false, error: 'Missing contact info', status: 400 }

  const rawItems = getRawItems(body)
  if (rawItems.length === 0) return { ok: false, error: 'At least one booking item is required', status: 400 }
  if (rawItems.length > 12) return { ok: false, error: 'Too many booking items in one checkout', status: 400 }

  const classTypes = await getClassTypes()
  const classTypeMap = new Map(classTypes.map(ct => [ct.id, ct]))
  const normalizedItems: NormalizedBookingItem[] = []

  for (const raw of rawItems) {
    const classTypeId = String(raw.classTypeId ?? '')
    const date = String(raw.date ?? '')
    const timeSlot = String(raw.timeSlot ?? '')
    const participants = Number(raw.participants)

    if (!classTypeId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'Invalid booking item date', status: 400 }
    if (!timeSlot || !/^\d{2}:\d{2}$/.test(timeSlot)) return { ok: false, error: 'Invalid booking item time', status: 400 }
    if (!Number.isInteger(participants) || participants < 1) return { ok: false, error: 'Invalid booking item participants', status: 400 }

    const classType = classTypeMap.get(classTypeId)
    if (!classType) return { ok: false, error: `Invalid class type: ${classTypeId}`, status: 400 }

    const minParticipants = getMinParticipants(classType)
    const maxParticipants = getMaxParticipants(classType)
    if (participants < minParticipants) {
      return { ok: false, error: `Minimum ${minParticipants} participants required for ${classType.name}`, status: 400 }
    }
    if (participants > maxParticipants) {
      return { ok: false, error: `Maximum ${maxParticipants} participants allowed for ${classType.name}`, status: 400 }
    }

    const dow = new Date(date + 'T12:00:00').getDay()
    const isoDow = dow === 0 ? 7 : dow

    const [
      { data: dateSlots, error: dateSlotsError },
      { data: weeklySlots, error: weeklySlotsError },
      { data: existingBookings, error: bookingsError },
    ] = await Promise.all([
      supabase.from('tour_slots').select('*').eq('class_type_id', classTypeId).eq('slot_date', date),
      supabase.from('weekly_slots').select('*').eq('class_type_id', classTypeId).eq('day_of_week', isoDow),
      supabase.from('bookings').select('participants, start_time, status, created_at')
        .eq('class_type_id', classTypeId)
        .eq('booking_date', date)
        .eq('start_time', timeSlot)
        .in('status', ['pending', 'confirmed']),
    ])

    if (dateSlotsError || weeklySlotsError || bookingsError) {
      return { ok: false, error: 'Database error while validating booking item', status: 500 }
    }

    const slotRows =
      dateSlots && dateSlots.length > 0 ? dateSlots
      : weeklySlots && weeklySlots.length > 0 ? weeklySlots
      : []
    const validSlots = slotRows.map(r => r.start_time.slice(0, 5))

    if (validSlots.length > 0 && !validSlots.includes(timeSlot)) {
      return { ok: false, error: `Invalid time slot for ${classType.name} on ${date}`, status: 400 }
    }

    const selectedSlot = slotRows.find(slot => slot.start_time.slice(0, 5) === timeSlot) ?? null
    if (selectedSlot) {
      const capacity = Math.max(0, Number(selectedSlot.capacity ?? classType.max_capacity ?? 1))
      const bookingMode = selectedSlot.booking_mode === 'exclusive' ? 'exclusive' : 'shared'
      const alreadyBooked = (existingBookings ?? [])
        .filter(holdsCapacity)
        .reduce((sum, booking) => sum + Number(booking.participants ?? 0), 0)
      const sameRequestParticipants = normalizedItems
        .filter(item => item.classTypeId === classTypeId && item.date === date && item.timeSlot === timeSlot)
        .reduce((sum, item) => sum + item.participants, 0)
      const remaining = Math.max(0, capacity - alreadyBooked - sameRequestParticipants)

      if (bookingMode === 'exclusive' && (alreadyBooked > 0 || sameRequestParticipants > 0)) {
        return { ok: false, error: `${classType.name} at ${timeSlot} is already reserved.`, status: 400 }
      }
      if (participants > capacity || participants > remaining) {
        return { ok: false, error: `Only ${remaining} spot${remaining === 1 ? '' : 's'} left for ${classType.name} at ${timeSlot}.`, status: 400 }
      }
    }

    normalizedItems.push({
      classTypeId,
      date,
      timeSlot,
      participants,
      totalAmount: calculateTotal(classType, participants),
    })
  }

  const totalAmount = normalizedItems.reduce((sum, item) => sum + item.totalAmount, 0)

  const normalizedContact: NormalizedContact = {
    name: String(contact.name).trim(),
    email: String(contact.email).trim().toLowerCase(),
    phone: contact.phone ? String(contact.phone).trim() : '',
    country: contact.country ? String(contact.country).trim() : '',
    notes: contact.notes ? String(contact.notes).trim() : '',
  }

  return { ok: true, contact: normalizedContact, normalizedItems, totalAmount, classTypeMap }
}
