export const prerender = false

import type { APIRoute } from 'astro'
import Stripe from 'stripe'
import { supabase } from '../../../lib/supabase'
import { getClassTypes, calculateTotal } from '../../../lib/classTypes'
import { getMinParticipants, getMaxParticipants } from '../../../lib/classTypeHelpers'
import { createPayPalOrder } from '../../../lib/paypalService'
import {
  sendAdminCartSummaryEmail,
  sendAdminNotification,
  sendCartSummaryEmail,
  sendConfirmationEmail,
} from '../../../lib/emailService'

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

function envFlag(name: string, fallback: boolean): boolean {
  const raw = (import.meta.env[name] ?? '').toString().trim().toLowerCase()
  if (!raw) return fallback
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on'
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
  const checkoutId = crypto.randomUUID()

  // Fetch payment config to determine payment provider
  let paymentProvider = 'on-site'
  let paypalClientId = ''
  let paypalSecret = ''
  let paypalSandbox = true
  try {
    const { data: config, error: configError } = await supabase
      .from('payment_config')
      .select('*')
      .eq('is_active', true)

    if (configError) console.error('[BookingCreate] Config error:', configError)

    if (config && Array.isArray(config) && config.length > 0) {
      const activeConfig = config[0]
      paymentProvider = String(activeConfig?.provider || 'on-site').toLowerCase().trim()
      paypalClientId = String(activeConfig?.paypal_client_id || '').trim()
      paypalSecret = String(activeConfig?.paypal_secret || '').trim()
      paypalSandbox = activeConfig?.paypal_sandbox !== false
      console.log('[BookingCreate] Provider:', paymentProvider, '| Sandbox:', paypalSandbox)
    }
  } catch (err) {
    console.error('[BookingCreate] Error fetching payment config:', err)
  }

  // Handle on-site payment (no payment processing needed)
  if (paymentProvider === 'on-site') {
    console.log('[BookingCreate] Processing on-site payment')
    const { data: bookings, error: dbError } = await supabase
      .from('bookings')
      .insert(
        normalizedItems.map(item => ({
          class_type_id: item.classTypeId,
          checkout_id: checkoutId,
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
          payment_method: null,
          stripe_payment_intent_id: null,
        }))
      )
      .select('id')

    if (dbError || !bookings || bookings.length === 0) {
      console.error('[BookingCreate] Failed to save bookings:', dbError)
      return json({ error: 'Failed to save bookings' }, 500)
    }

    const bookingIds = bookings.map(b => b.id)

    // Send reservation emails (on-site mode)
    const sendSummary = envFlag('EMAIL_SUMMARY_ENABLED', true)
    const sendAdminSummary = envFlag('EMAIL_ADMIN_SUMMARY_ENABLED', true)
    const nowIso = new Date().toISOString()
    const summaryItems = normalizedItems.map((item, index) => ({
      bookingId: bookings[index]?.id ?? '',
      classTypeId: item.classTypeId,
      bookingDate: item.date,
      startTime: item.timeSlot,
      participants: item.participants,
      totalAmount: item.totalAmount,
    }))

    if (sendSummary) {
      try {
        await sendCartSummaryEmail({
          checkoutId,
          customerName: contact.name.trim(),
          customerEmail: contact.email.trim().toLowerCase(),
          items: summaryItems,
          mode: 'on-site',
        })
        await supabase.from('bookings').update({ checkout_summary_sent_at: nowIso }).eq('checkout_id', checkoutId)
      } catch (error) {
        console.error('[BookingCreate] Failed to send on-site reservation email to customer', { checkoutId, error })
      }
    }

    if (sendAdminSummary) {
      try {
        await sendAdminCartSummaryEmail({
          checkoutId,
          customerName: contact.name.trim(),
          customerEmail: contact.email.trim().toLowerCase(),
          items: summaryItems,
          mode: 'on-site',
        })
        await supabase.from('bookings').update({ checkout_admin_summary_sent_at: nowIso }).eq('checkout_id', checkoutId)
      } catch (error) {
        console.error('[BookingCreate] Failed to send on-site reservation email to admin', { checkoutId, error })
      }
    }

    return json({
      bookingId: bookingIds[0],
      bookingIds,
      checkoutId,
      clientSecret: null,
      totalAmount,
      provider: 'on-site',
    })
  }

  // Handle PayPal payment (without credentials - show config error in UI)
  if (paymentProvider === 'paypal' && (!paypalClientId || !paypalSecret)) {
    const { data: bookings, error: dbError } = await supabase
      .from('bookings')
      .insert(
        normalizedItems.map(item => ({
          class_type_id: item.classTypeId,
          checkout_id: checkoutId,
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
          payment_method: 'paypal',
          stripe_payment_intent_id: null,
        }))
      )
      .select('id')

    if (dbError || !bookings || bookings.length === 0) return json({ error: 'Failed to save bookings' }, 500)

    const bookingIds = bookings.map(b => b.id)
    return json({
      bookingId: bookingIds[0],
      bookingIds,
      checkoutId,
      clientSecret: null,
      paypalOrderId: null,
      totalAmount,
      provider: 'paypal',
    })
  }

  // Handle PayPal payment (with credentials)
  if (paymentProvider === 'paypal' && paypalClientId && paypalSecret) {
    let paypalOrderId = ''
    try {
      paypalOrderId = await createPayPalOrder(paypalClientId, paypalSecret, totalAmount, 'USD', paypalSandbox)
    } catch (err: any) {
      return json({ error: `PayPal order creation failed: ${err.message}` }, 500)
    }

    const { data: bookings, error: dbError } = await supabase
      .from('bookings')
      .insert(
        normalizedItems.map(item => ({
          class_type_id: item.classTypeId,
          checkout_id: checkoutId,
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
          payment_method: 'paypal',
          stripe_payment_intent_id: paypalOrderId,
        }))
      )
      .select('id')

    if (dbError || !bookings || bookings.length === 0) {
      return json({ error: 'Failed to save bookings' }, 500)
    }

    const bookingIds = bookings.map(b => b.id)
    return json({
      bookingId: bookingIds[0],
      bookingIds,
      checkoutId,
      clientSecret: null,
      paypalOrderId,
      paypalSandbox,
      paypalClientId,
      totalAmount,
      provider: 'paypal',
    })
  }

  // TEST MODE (no Stripe key)
  if (!stripeKey) {
    const { data: bookings, error: dbError } = await supabase
      .from('bookings')
      .insert(
        normalizedItems.map(item => ({
          class_type_id: item.classTypeId,
          checkout_id: checkoutId,
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

    const sendSummary = envFlag('EMAIL_SUMMARY_ENABLED', true)
    const sendAdminSummary = envFlag('EMAIL_ADMIN_SUMMARY_ENABLED', true)
    const sendIndividual = envFlag('EMAIL_INDIVIDUAL_ENABLED', false)
    const nowIso = new Date().toISOString()

    const summaryItems = normalizedItems.map((item, index) => ({
      bookingId: bookings[index]?.id ?? '',
      classTypeId: item.classTypeId,
      bookingDate: item.date,
      startTime: item.timeSlot,
      participants: item.participants,
      totalAmount: item.totalAmount,
    }))

    if (sendSummary) {
      try {
        await sendCartSummaryEmail({
          checkoutId,
          customerName: contact.name.trim(),
          customerEmail: contact.email.trim().toLowerCase(),
          items: summaryItems,
        })
        await supabase.from('bookings').update({ checkout_summary_sent_at: nowIso }).eq('checkout_id', checkoutId)
      } catch (error) {
        console.error('Failed to send customer checkout summary email (test mode)', { checkoutId, error })
      }
    }

    if (sendAdminSummary) {
      try {
        await sendAdminCartSummaryEmail({
          checkoutId,
          customerName: contact.name.trim(),
          customerEmail: contact.email.trim().toLowerCase(),
          items: summaryItems,
        })
        await supabase.from('bookings').update({ checkout_admin_summary_sent_at: nowIso }).eq('checkout_id', checkoutId)
      } catch (error) {
        console.error('Failed to send admin checkout summary email (test mode)', { checkoutId, error })
      }
    }

    if (sendIndividual) {
      try {
        await Promise.all([
          ...summaryItems.map(item => sendConfirmationEmail({
            bookingId: item.bookingId,
            customerName: contact.name.trim(),
            customerEmail: contact.email.trim().toLowerCase(),
            classTypeId: item.classTypeId,
            bookingDate: item.bookingDate,
            startTime: item.startTime,
            participants: item.participants,
            totalAmount: item.totalAmount,
          })),
          ...summaryItems.map(item => sendAdminNotification({
            bookingId: item.bookingId,
            customerName: contact.name.trim(),
            customerEmail: contact.email.trim().toLowerCase(),
            classTypeId: item.classTypeId,
            bookingDate: item.bookingDate,
            startTime: item.startTime,
            participants: item.participants,
            totalAmount: item.totalAmount,
          })),
        ])
      } catch (error) {
        console.error('Failed to send individual booking emails (test mode)', { checkoutId, error })
      }
    }

    const bookingIds = bookings.map(b => b.id)
    return json({
      bookingId: bookingIds[0],
      bookingIds,
      checkoutId,
      clientSecret: null,
      totalAmount,
      provider: 'on-site',
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
        checkoutId,
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
        checkout_id: checkoutId,
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
    checkoutId,
    clientSecret: paymentIntent.client_secret,
    totalAmount,
    provider: 'stripe',
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
