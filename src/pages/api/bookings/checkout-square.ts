export const prerender = false

import type { APIRoute } from 'astro'
import { isSupabaseConfigured, supabase } from '../../../lib/supabase'
import { validateBooking } from '../../../lib/bookingValidation'
import { createSquarePayment } from '../../../lib/squareService'
import { sendCartSummaryEmail, sendAdminCartSummaryEmail } from '../../../lib/emailService'

function envFlag(name: string, fallback: boolean): boolean {
  const raw = (import.meta.env[name] ?? '').toString().trim().toLowerCase()
  if (!raw) return fallback
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on'
}

/**
 * Atomic "pay-first" checkout for Square: validates availability, charges the
 * card, and ONLY persists the bookings (as `confirmed`) once the charge returns
 * COMPLETED. No `pending` row is ever created — if the customer abandons the
 * card form, nothing is written and no capacity is held.
 */
export const POST: APIRoute = async ({ request }) => {
  if (!isSupabaseConfigured) {
    return json({ error: 'Booking database is not configured.' }, 503)
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const sourceId = body?.sourceId
  if (!sourceId || typeof sourceId !== 'string') {
    return json({ error: 'Missing card token' }, 400)
  }

  // Re-validate availability/capacity server-side (anti-tamper, anti last-second clash)
  const validation = await validateBooking(body)
  if (!validation.ok) return json({ error: validation.error }, validation.status)

  const { contact, normalizedItems, totalAmount, classTypeMap } = validation

  // Confirm Square is the active provider and credentials exist
  const { data: config, error: configError } = await supabase
    .from('payment_config')
    .select('*')
    .eq('is_active', true)
    .single()

  if (configError || !config) {
    return json({ error: 'Payment configuration not found' }, 500)
  }
  if (String(config.provider || '').toLowerCase().trim() !== 'square') {
    return json({ error: 'Square is not the active payment provider' }, 400)
  }
  if (!config.square_access_token || !config.square_location_id) {
    return json({ error: 'Square configuration is incomplete' }, 500)
  }

  const checkoutId = crypto.randomUUID()

  // ── Charge FIRST ─────────────────────────────────────────────────────────────
  let squarePaymentId: string
  try {
    const result = await createSquarePayment({
      accessToken: config.square_access_token,
      sandbox: config.square_sandbox !== false,
      sourceId,
      amountDollars: totalAmount,
      currency: 'USD',
      locationId: config.square_location_id,
      idempotencyKey: checkoutId,
    })

    if (result.status !== 'COMPLETED') {
      return json({ error: `Payment not completed (status: ${result.status})` }, 400)
    }
    squarePaymentId = result.paymentId
  } catch (err: any) {
    console.error('[CheckoutSquare] Payment failed:', err)
    return json({ error: err.message }, 400)
  }

  // ── Payment succeeded → persist bookings as confirmed ────────────────────────
  const rows = normalizedItems.map(item => ({
    class_type_id: item.classTypeId,
    checkout_id: checkoutId,
    booking_date: item.date,
    start_time: item.timeSlot,
    participants: item.participants,
    total_amount: item.totalAmount,
    customer_name: contact.name,
    customer_email: contact.email,
    customer_phone: contact.phone,
    customer_country: contact.country,
    notes: contact.notes,
    status: 'confirmed' as const,
    payment_method: 'square',
    external_payment_id: squarePaymentId,
  }))

  const { data: bookings, error: dbError } = await supabase
    .from('bookings')
    .insert(rows)
    .select('id')

  if (dbError || !bookings || bookings.length === 0) {
    // The customer WAS charged but the booking failed to save. Surface the
    // payment id so it can be reconciled/refunded manually.
    console.error('[CheckoutSquare] PAYMENT CAPTURED BUT BOOKING INSERT FAILED', {
      squarePaymentId, checkoutId, dbError,
    })
    return json({
      error: `Your payment went through but we couldn't save your booking. Please contact us on WhatsApp with this reference: ${squarePaymentId}`,
      paymentId: squarePaymentId,
    }, 500)
  }

  const bookingIds = bookings.map(b => b.id)

  // ── Confirmation emails ──────────────────────────────────────────────────────
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
        customerName: contact.name,
        customerEmail: contact.email,
        customerPhone: contact.phone,
        customerCountry: contact.country,
        customerNotes: contact.notes,
        paymentMethod: 'square',
        items: summaryItems,
        mode: 'paid',
      })
      await supabase.from('bookings').update({ checkout_summary_sent_at: nowIso }).eq('checkout_id', checkoutId)
    } catch (err) {
      console.error('[CheckoutSquare] Failed to send customer email:', err)
    }
  }

  if (sendAdminSummary) {
    try {
      await sendAdminCartSummaryEmail({
        checkoutId,
        customerName: contact.name,
        customerEmail: contact.email,
        customerPhone: contact.phone,
        customerCountry: contact.country,
        customerNotes: contact.notes,
        paymentMethod: 'square',
        items: summaryItems,
        mode: 'paid',
      })
      await supabase.from('bookings').update({ checkout_admin_summary_sent_at: nowIso }).eq('checkout_id', checkoutId)
    } catch (err) {
      console.error('[CheckoutSquare] Failed to send admin email:', err)
    }
  }

  return json({
    success: true,
    bookingIds,
    checkoutId,
    totalAmount,
    status: 'confirmed',
  })
}

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
