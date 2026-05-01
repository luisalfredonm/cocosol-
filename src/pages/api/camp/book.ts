export const prerender = false

import type { APIRoute } from 'astro'
import Stripe from 'stripe'
import { supabase } from '../../../lib/supabase'

export const POST: APIRoute = async ({ request }) => {
  let body: any
  try { body = await request.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const { sessionId, roomId, persons, guest1, additionalGuests, notes } = body ?? {}

  // Basic validation
  if (!sessionId || !roomId) return json({ error: 'Missing sessionId or roomId' }, 400)
  if (!Number.isInteger(persons) || persons < 1) return json({ error: 'Invalid persons count' }, 400)
  if (!guest1?.name || !guest1?.email || !guest1?.phone) return json({ error: 'Guest 1 info required' }, 400)
  const extraGuests: { name: string; email?: string }[] = Array.isArray(additionalGuests) ? additionalGuests : []
  if (persons > 1 && extraGuests.length < persons - 1) return json({ error: 'Missing additional guest info' }, 400)
  for (const g of extraGuests.slice(0, persons - 1)) {
    if (!g?.name?.trim()) return json({ error: 'Name required for all guests' }, 400)
  }

  // Fetch session
  const { data: session, error: sessionError } = await supabase
    .from('camp_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('is_active', true)
    .single()

  if (sessionError || !session) return json({ error: 'Session not found' }, 404)

  // Verify room belongs to this session
  const { data: sessionRoom } = await supabase
    .from('camp_session_rooms')
    .select('id')
    .eq('session_id', sessionId)
    .eq('room_id', roomId)
    .single()

  if (!sessionRoom) return json({ error: 'Room not assigned to this session' }, 400)

  // Check room availability considering DATE OVERLAPS across all sessions
  // A room is unavailable if it's booked in ANY session whose dates overlap with this session
  const { data: overlappingSessions } = await supabase
    .from('camp_sessions')
    .select('id')
    .lte('start_date', session.end_date)   // other session starts before or on our end
    .gte('end_date', session.start_date)   // other session ends on or after our start

  const overlappingIds = (overlappingSessions ?? []).map(s => s.id)

  const { count } = await supabase
    .from('camp_bookings')
    .select('id', { count: 'exact', head: true })
    .in('session_id', overlappingIds)
    .eq('room_id', roomId)
    .in('status', ['pending', 'confirmed'])

  if ((count ?? 0) > 0) return json({ error: 'Room no longer available for these dates' }, 409)

  // Fetch payment settings
  const { data: settings } = await supabase
    .from('camp_settings')
    .select('*')
    .eq('id', 1)
    .single()

  const paymentMode = settings?.payment_mode ?? 'full'
  const depositPct = settings?.deposit_percentage ?? 30

  const fullAmount = Number(session.price_per_person_usd) * persons
  const chargedAmount = paymentMode === 'deposit'
    ? Math.round(fullAmount * depositPct) / 100
    : fullAmount

  const stripeKey = import.meta.env.STRIPE_SECRET_KEY

  const guestsJson = [
    { name: guest1.name.trim(), email: guest1.email.trim().toLowerCase(), phone: guest1.phone.trim() },
    ...extraGuests.slice(0, persons - 1).map(g => ({
      name: g.name.trim(),
      email: g.email?.trim().toLowerCase() ?? '',
    })),
  ]

  const bookingPayload = {
    session_id: sessionId,
    room_id: roomId,
    persons,
    guest1_name: guest1.name.trim(),
    guest1_email: guest1.email.trim().toLowerCase(),
    guest1_phone: guest1.phone.trim(),
    guest2_name: persons >= 2 ? (extraGuests[0]?.name?.trim() ?? null) : null,
    guest2_email: persons >= 2 ? (extraGuests[0]?.email?.trim().toLowerCase() ?? null) : null,
    guests_json: guestsJson,
    full_amount_usd: fullAmount,
    charged_amount_usd: chargedAmount,
    payment_mode: paymentMode,
    notes: notes?.trim() ?? null,
  }

  // TEST MODE (no Stripe key)
  if (!stripeKey) {
    const { data: booking, error: dbError } = await supabase
      .from('camp_bookings')
      .insert({ ...bookingPayload, status: 'confirmed' })
      .select('id')
      .single()

    if (dbError) console.error('[camp/book] DB insert error (test mode):', dbError)
    if (dbError || !booking) return json({ error: `Failed to save booking: ${dbError?.message ?? 'unknown'}` }, 500)

    return json({ bookingId: booking.id, clientSecret: null, chargedAmount, fullAmount, paymentMode })
  }

  // PRODUCTION MODE — create Stripe PaymentIntent
  const stripe = new Stripe(stripeKey)
  let paymentIntent: Stripe.PaymentIntent
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(chargedAmount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        booking_type: 'camp',
        session_id: sessionId,
        room_id: roomId,
        guest_email: guest1.email,
        guest_name: guest1.name,
      },
    })
  } catch (err: any) {
    return json({ error: `Stripe error: ${err.message}` }, 500)
  }

  const { data: booking, error: dbError } = await supabase
    .from('camp_bookings')
    .insert({ ...bookingPayload, external_payment_id: paymentIntent.id, status: 'pending' })
    .select('id')
    .single()

  if (dbError || !booking) {
    console.error('[camp/book] DB insert error (production):', dbError)
    await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {})
    return json({ error: 'Failed to save booking' }, 500)
  }

  return json({
    bookingId: booking.id,
    clientSecret: paymentIntent.client_secret,
    chargedAmount,
    fullAmount,
    paymentMode,
  })
}

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
