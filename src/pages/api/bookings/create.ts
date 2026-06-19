export const prerender = false

import type { APIRoute } from 'astro'
import { isSupabaseConfigured, supabase } from '../../../lib/supabase'
import { validateBooking } from '../../../lib/bookingValidation'
import { createPayPalOrder } from '../../../lib/paypalService'
import {
  sendAdminCartSummaryEmail,
  sendCartSummaryEmail,
} from '../../../lib/emailService'

interface BookingInsertRow {
  class_type_id: string
  checkout_id: string
  booking_date: string
  start_time: string
  participants: number
  total_amount: number
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_country: string
  notes: string
  status: 'pending' | 'confirmed' | 'cancelled'
  payment_method: string
}

function envFlag(name: string, fallback: boolean): boolean {
  const raw = (import.meta.env[name] ?? '').toString().trim().toLowerCase()
  if (!raw) return fallback
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on'
}

export const POST: APIRoute = async ({ request }) => {
  if (!isSupabaseConfigured) {
    return json({ error: 'Booking database is not configured. Add Supabase env vars to save reservations.' }, 503)
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const validation = await validateBooking(body)
  if (!validation.ok) return json({ error: validation.error }, validation.status)

  const { contact, normalizedItems, totalAmount, classTypeMap } = validation
  const checkoutId = crypto.randomUUID()
  const baseBookingRows: BookingInsertRow[] = normalizedItems.map(item => ({
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
    payment_method: 'on-site',
  }))

  // Fetch payment config to determine payment provider
  let paymentProvider = 'on-site'
  let paypalClientId = ''
  let paypalSecret = ''
  let paypalSandbox = true
  let squareApplicationId = ''
  let squareLocationId = ''
  let squareSandbox = true
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
      squareApplicationId = String(activeConfig?.square_application_id || '').trim()
      squareLocationId = String(activeConfig?.square_location_id || '').trim()
      squareSandbox = activeConfig?.square_sandbox !== false
      console.log('[BookingCreate] Provider:', paymentProvider)
    }
  } catch (err) {
    console.error('[BookingCreate] Error fetching payment config:', err)
  }

  // Handle on-site payment (no payment processing needed)
  if (paymentProvider === 'on-site') {
    console.log('[BookingCreate] Processing on-site payment')
    const { data: bookings, error: dbError } = await insertBookings(
      baseBookingRows.map(row => ({
        ...row,
        status: 'confirmed',
        payment_method: 'on-site',
      })),
      null
    )

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
      classTypeName: classTypeMap.get(item.classTypeId)?.name,
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
          customerPhone: contact.phone?.trim(),
          customerCountry: contact.country?.trim(),
          customerNotes: contact.notes?.trim(),
          paymentMethod: 'on-site',
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
          customerPhone: contact.phone?.trim(),
          customerCountry: contact.country?.trim(),
          customerNotes: contact.notes?.trim(),
          paymentMethod: 'on-site',
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
    const { data: bookings, error: dbError } = await insertBookings(
      baseBookingRows.map(row => ({
        ...row,
        status: 'pending',
        payment_method: 'paypal',
      })),
      null
    )

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

  // Handle Credomatic payment (placeholder - awaiting API)
  if (paymentProvider === 'credomatic') {
    const { data: bookings, error: dbError } = await insertBookings(
      baseBookingRows.map(row => ({
        ...row,
        status: 'pending',
        payment_method: 'credomatic',
      })),
      null
    )

    if (dbError || !bookings || bookings.length === 0) return json({ error: 'Failed to save bookings' }, 500)

    const bookingIds = bookings.map(b => b.id)
    return json({
      bookingId: bookingIds[0],
      bookingIds,
      checkoutId,
      clientSecret: null,
      totalAmount,
      provider: 'credomatic',
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

    const { data: bookings, error: dbError } = await insertBookings(
      baseBookingRows.map(row => ({
        ...row,
        status: 'pending',
        payment_method: 'paypal',
      })),
      paypalOrderId
    )

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

  // Handle Square payment
  if (paymentProvider === 'square') {
    const { data: bookings, error: dbError } = await insertBookings(
      baseBookingRows.map(row => ({
        ...row,
        status: 'pending',
        payment_method: 'square',
      })),
      null
    )

    if (dbError || !bookings || bookings.length === 0) {
      console.error('[BookingCreate] Square DB error:', dbError)
      return json({ error: 'Failed to save bookings' }, 500)
    }

    const bookingIds = bookings.map(b => b.id)
    return json({
      bookingId: bookingIds[0],
      bookingIds,
      checkoutId,
      clientSecret: null,
      totalAmount,
      provider: 'square',
      squareApplicationId,
      squareLocationId,
      squareSandbox,
    })
  }

  // Default: fallback to on-site if no provider is recognized
  return json({
    error: 'Invalid or unconfigured payment provider',
  }, 400)
}

async function insertBookings(rows: BookingInsertRow[], externalPaymentId: string | null) {
  return supabase
    .from('bookings')
    .insert(rows.map(row => ({
      ...row,
      external_payment_id: externalPaymentId,
    })))
    .select('id')
}

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
