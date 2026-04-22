export const prerender = false

import type { APIRoute } from 'astro'
import Stripe from 'stripe'
import { supabase } from '../../../lib/supabase'
import { getClassTypes, calculateTotal } from '../../../lib/classTypes'
import { getMinParticipants, getMaxParticipants } from '../../../lib/classTypeHelpers'

interface RawBookingItem {
  classTypeId?: unknown
  date?: unknown
  timeSlot?: unknown
  participants?: unknown
}

interface NormalizedBookingItem {
  classTypeId: string
  date: string
  timeSlot: string
  participants: number
  totalAmount: number
}

export const POST: APIRoute = async ({ request }) => {
  let body: any
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const contact = body?.contact
  if (!contact?.name || !contact?.email) return json({ error: 'Missing contact info' }, 400)

  const rawItems = getRawItems(body)
  if (rawItems.length === 0) return json({ error: 'At least one booking item is required' }, 400)
  if (rawItems.length > 12) return json({ error: 'Too many booking items in one checkout' }, 400)

  const classTypes = await getClassTypes()
  const classTypeMap = new Map(classTypes.map(ct => [ct.id, ct]))
  const normalizedItems: NormalizedBookingItem[] = []

  for (const raw of rawItems) {
    const classTypeId = String(raw.classTypeId ?? '')
    const date = String(raw.date ?? '')
    const timeSlot = String(raw.timeSlot ?? '')
    const participants = Number(raw.participants)

    if (!classTypeId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'Invalid booking item date' }, 400)
    if (!timeSlot || !/^\d{2}:\d{2}$/.test(timeSlot)) return json({ error: 'Invalid booking item time' }, 400)
    if (!Number.isInteger(participants) || participants < 1) return json({ error: 'Invalid booking item participants' }, 400)

    const classType = classTypeMap.get(classTypeId)
    if (!classType) return json({ error: `Invalid class type: ${classTypeId}` }, 400)

    const minParticipants = getMinParticipants(classType)
    const maxParticipants = getMaxParticipants(classType)
    if (participants < minParticipants) {
      return json({ error: `Minimum ${minParticipants} participants required for ${classType.name}` }, 400)
    }
    if (participants > maxParticipants) {
      return json({ error: `Maximum ${maxParticipants} participants allowed for ${classType.name}` }, 400)
    }

    const dow = new Date(date + 'T12:00:00').getDay()
    const isoDow = dow === 0 ? 7 : dow

    const [{ data: dateSlots, error: dateSlotsError }, { data: weeklySlots, error: weeklySlotsError }] = await Promise.all([
      supabase.from('tour_slots').select('start_time').eq('class_type_id', classTypeId).eq('slot_date', date),
      supabase.from('weekly_slots').select('start_time').eq('class_type_id', classTypeId).eq('day_of_week', isoDow),
    ])

    if (dateSlotsError || weeklySlotsError) {
      return json({ error: 'Database error while validating booking item' }, 500)
    }

    const validSlots =
      dateSlots && dateSlots.length > 0 ? dateSlots.map(r => r.start_time.slice(0, 5))
      : weeklySlots && weeklySlots.length > 0 ? weeklySlots.map(r => r.start_time.slice(0, 5))
      : []

    if (validSlots.length > 0 && !validSlots.includes(timeSlot)) {
      return json({ error: `Invalid time slot for ${classType.name} on ${date}` }, 400)
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
  const stripeKey = import.meta.env.STRIPE_SECRET_KEY

  // TEST MODE
  if (!stripeKey) {
    const { data: bookings, error: dbError } = await supabase
      .from('bookings')
      .insert(
        normalizedItems.map(item => ({
          class_type_id: item.classTypeId,
          booking_date: item.date,
          start_time: item.timeSlot,
          participants: item.participants,
          total_amount: item.totalAmount,
          customer_name: contact.name.trim(),
          customer_email: contact.email.trim().toLowerCase(),
          customer_phone: contact.phone?.trim() ?? '',
          customer_country: contact.country?.trim() ?? '',
          notes: contact.notes?.trim() ?? '',
          status: 'confirmed',
          payment_method: null,
          stripe_payment_intent_id: null,
        }))
      )
      .select('id')

    if (dbError || !bookings || bookings.length === 0) return json({ error: 'Failed to save bookings' }, 500)

    const bookingIds = bookings.map(b => b.id)
    return json({
      bookingId: bookingIds[0],
      bookingIds,
      clientSecret: null,
      totalAmount,
    })
  }

  // PRODUCTION MODE
  const stripe = new Stripe(stripeKey)
  let paymentIntent: Stripe.PaymentIntent
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingItems: String(normalizedItems.length),
        customerEmail: contact.email,
        customerName: contact.name,
      },
    })
  } catch (err: any) {
    return json({ error: `Stripe error: ${err.message}` }, 500)
  }

  const { data: bookings, error: dbError } = await supabase
    .from('bookings')
    .insert(
      normalizedItems.map(item => ({
        class_type_id: item.classTypeId,
        booking_date: item.date,
        start_time: item.timeSlot,
        participants: item.participants,
        total_amount: item.totalAmount,
        customer_name: contact.name.trim(),
        customer_email: contact.email.trim().toLowerCase(),
        customer_phone: contact.phone?.trim() ?? '',
        customer_country: contact.country?.trim() ?? '',
        notes: contact.notes?.trim() ?? '',
        status: 'pending',
        payment_method: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
      }))
    )
    .select('id')

  if (dbError || !bookings || bookings.length === 0) {
    await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {})
    return json({ error: 'Failed to save bookings' }, 500)
  }

  const bookingIds = bookings.map(b => b.id)
  return json({
    bookingId: bookingIds[0],
    bookingIds,
    clientSecret: paymentIntent.client_secret,
    totalAmount,
  })
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

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
