export const prerender = false

import type { APIRoute } from 'astro'
import { supabase } from '../../../lib/supabase'
import { capturePayPalOrder } from '../../../lib/paypalService'
import {
  sendCartSummaryEmail,
  sendAdminCartSummaryEmail,
} from '../../../lib/emailService'

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

  const { bookingIds, orderId } = body
  if (!Array.isArray(bookingIds) || bookingIds.length === 0 || !orderId) {
    return json({ error: 'Missing bookingIds or orderId' }, 400)
  }

  // Fetch bookings to get payment config
  const { data: bookings, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .in('id', bookingIds)

  if (fetchError || !bookings || bookings.length === 0) {
    return json({ error: 'Bookings not found' }, 404)
  }

  // Fetch payment config to get PayPal credentials
  const { data: config, error: configError } = await supabase
    .from('payment_config')
    .select('*')
    .eq('is_active', true)
    .single()

  if (configError || !config || !config.paypal_client_id || !config.paypal_secret) {
    return json({ error: 'PayPal configuration not found' }, 500)
  }

  // Capture PayPal order
  let paypalOrder
  try {
    paypalOrder = await capturePayPalOrder(config.paypal_client_id, config.paypal_secret, orderId)
  } catch (err: any) {
    return json({ error: `PayPal capture failed: ${err.message}` }, 500)
  }

  if (paypalOrder.status !== 'COMPLETED') {
    return json({ error: 'PayPal payment not completed' }, 400)
  }

  // Update bookings to confirmed
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    })
    .in('id', bookingIds)

  if (updateError) {
    return json({ error: 'Failed to update bookings' }, 500)
  }

  // Send confirmation emails
  const sendSummary = envFlag('EMAIL_SUMMARY_ENABLED', true)
  const sendAdminSummary = envFlag('EMAIL_ADMIN_SUMMARY_ENABLED', true)
  const first = bookings[0]
  const checkoutId = first?.checkout_id ?? orderId
  const nowIso = new Date().toISOString()
  const summaryItems = bookings.map(b => ({
    bookingId: b.id,
    classTypeId: b.class_type_id,
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
        items: summaryItems,
        mode: 'paid',
      })
      await supabase.from('bookings').update({ checkout_summary_sent_at: nowIso }).eq('checkout_id', checkoutId)
    } catch (error) {
      console.error('Failed to send PayPal confirmation email to customer', { error })
    }
  }

  if (sendAdminSummary) {
    try {
      await sendAdminCartSummaryEmail({
        checkoutId,
        customerName: first.customer_name,
        customerEmail: first.customer_email,
        items: summaryItems,
        mode: 'paid',
      })
      await supabase.from('bookings').update({ checkout_admin_summary_sent_at: nowIso }).eq('checkout_id', checkoutId)
    } catch (error) {
      console.error('Failed to send PayPal confirmation email to admin', { error })
    }
  }

  return json({
    success: true,
    bookingIds,
    status: 'confirmed',
  })
}

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
