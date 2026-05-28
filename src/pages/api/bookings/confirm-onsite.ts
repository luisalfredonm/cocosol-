export const prerender = false

import type { APIRoute } from 'astro'
import { supabase } from '../../../lib/supabase'
import { sendCartSummaryEmail, sendAdminCartSummaryEmail } from '../../../lib/emailService'

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

  const { bookingIds, checkoutId } = body
  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    return json({ error: 'Missing bookingIds' }, 400)
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .in('id', bookingIds)

  if (error) {
    return json({ error: 'Failed to confirm bookings' }, 500)
  }

  // Send confirmation emails
  const sendSummary = envFlag('EMAIL_SUMMARY_ENABLED', true)
  const sendAdminSummary = envFlag('EMAIL_ADMIN_SUMMARY_ENABLED', true)

  if ((sendSummary || sendAdminSummary) && checkoutId) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, class_types(name)')
      .in('id', bookingIds)

    if (bookings && bookings.length > 0) {
      const first = bookings[0]
      const summaryItems = bookings.map(b => ({
        bookingId: b.id,
        classTypeId: b.class_type_id,
        classTypeName: b.class_types?.name,
        bookingDate: b.booking_date,
        startTime: b.start_time,
        participants: b.participants,
        totalAmount: Number(b.total_amount),
      }))

      const nowIso = new Date().toISOString()

      if (sendSummary) {
        try {
          await sendCartSummaryEmail({
            checkoutId,
            customerName: first.customer_name,
            customerEmail: first.customer_email,
            items: summaryItems,
          })
          await supabase.from('bookings').update({ checkout_summary_sent_at: nowIso }).eq('checkout_id', checkoutId)
        } catch (e) {
          console.error('Failed to send customer summary email (on-site confirm)', e)
        }
      }

      if (sendAdminSummary) {
        try {
          await sendAdminCartSummaryEmail({
            checkoutId,
            customerName: first.customer_name,
            customerEmail: first.customer_email,
            items: summaryItems,
          })
          await supabase.from('bookings').update({ checkout_admin_summary_sent_at: nowIso }).eq('checkout_id', checkoutId)
        } catch (e) {
          console.error('Failed to send admin summary email (on-site confirm)', e)
        }
      }
    }
  }

  return json({ success: true })
}

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
