export const prerender = false

import type { APIRoute } from 'astro'
import { supabase } from '../../../lib/supabase'
import { createSquarePayment } from '../../../lib/squareService'
import { sendCartSummaryEmail, sendAdminCartSummaryEmail } from '../../../lib/emailService'

function envFlag(name: string, fallback: boolean): boolean {
  const raw = (import.meta.env[name] ?? '').toString().trim().toLowerCase()
  if (!raw) return fallback
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on'
}

export const POST: APIRoute = async ({ request }) => {
  let body: any
  try { body = await request.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const { bookingIds, sourceId } = body
  if (!Array.isArray(bookingIds) || bookingIds.length === 0 || !sourceId) {
    return json({ error: 'Missing bookingIds or sourceId' }, 400)
  }

  // Fetch bookings
  const { data: bookings, error: fetchError } = await supabase
    .from('bookings')
    .select('*, class_types(name)')
    .in('id', bookingIds)

  if (fetchError || !bookings || bookings.length === 0) {
    return json({ error: 'Bookings not found' }, 404)
  }

  // Fetch Square config
  const { data: config, error: configError } = await supabase
    .from('payment_config')
    .select('*')
    .eq('is_active', true)
    .single()

  if (configError || !config || !config.square_access_token || !config.square_location_id) {
    return json({ error: 'Square configuration not found' }, 500)
  }

  const totalAmount = bookings.reduce((sum: number, b: any) => sum + Number(b.total_amount), 0)
  const checkoutId = bookings[0]?.checkout_id

  // Charge via Square
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
    console.error('[CaptureSquare] Payment failed:', err)
    return json({ error: err.message }, 400)
  }

  // Confirm bookings in DB
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      external_payment_id: squarePaymentId,
      updated_at: new Date().toISOString(),
    })
    .in('id', bookingIds)

  if (updateError) {
    console.error('[CaptureSquare] Failed to confirm bookings:', updateError)
    return json({ error: 'Failed to confirm bookings' }, 500)
  }

  // Send confirmation emails
  const sendSummary = envFlag('EMAIL_SUMMARY_ENABLED', true)
  const sendAdminSummary = envFlag('EMAIL_ADMIN_SUMMARY_ENABLED', true)
  const first = bookings[0]
  const nowIso = new Date().toISOString()
  const summaryItems = bookings.map((b: any) => ({
    bookingId: b.id,
    classTypeId: b.class_type_id,
    classTypeName: b.class_types?.name,
    bookingDate: b.booking_date,
    startTime: b.start_time,
    participants: b.participants,
    totalAmount: Number(b.total_amount),
  }))

  if (sendSummary) {
    try {
      await sendCartSummaryEmail({
        checkoutId,
        customerName: first.customer_name,
        customerEmail: first.customer_email,
        customerPhone: first.customer_phone,
        customerCountry: first.customer_country,
        customerNotes: first.notes,
        paymentMethod: 'square',
        items: summaryItems,
        mode: 'paid',
      })
      await supabase.from('bookings').update({ checkout_summary_sent_at: nowIso }).eq('checkout_id', checkoutId)
    } catch (err) {
      console.error('[CaptureSquare] Failed to send customer email:', err)
    }
  }

  if (sendAdminSummary) {
    try {
      await sendAdminCartSummaryEmail({
        checkoutId,
        customerName: first.customer_name,
        customerEmail: first.customer_email,
        customerPhone: first.customer_phone,
        customerCountry: first.customer_country,
        customerNotes: first.notes,
        paymentMethod: 'square',
        items: summaryItems,
        mode: 'paid',
      })
      await supabase.from('bookings').update({ checkout_admin_summary_sent_at: nowIso }).eq('checkout_id', checkoutId)
    } catch (err) {
      console.error('[CaptureSquare] Failed to send admin email:', err)
    }
  }

  return json({ success: true, bookingIds, status: 'confirmed' })
}

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
