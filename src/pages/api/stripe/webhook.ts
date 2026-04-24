export const prerender = false

import type { APIRoute } from 'astro'
import Stripe from 'stripe'
import { supabase } from '../../../lib/supabase'
import {
  sendAdminCartSummaryEmail,
  sendAdminNotification,
  sendCartSummaryEmail,
  sendConfirmationEmail,
} from '../../../lib/emailService'

function envFlag(name: string, fallback: boolean): boolean {
  const raw = (import.meta.env[name] ?? '').toString().trim().toLowerCase()
  if (!raw) return fallback
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on'
}

function groupByCheckoutId(bookings: any[], fallback: string): Record<string, any[]> {
  const grouped: Record<string, any[]> = {}
  for (const booking of bookings) {
    const key = booking.checkout_id ?? fallback
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(booking)
  }
  return grouped
}

export const POST: APIRoute = async ({ request }) => {
  const stripeKey = import.meta.env.STRIPE_SECRET_KEY
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || !webhookSecret) {
    return new Response('Stripe not configured', { status: 500 })
  }

  const stripe = new Stripe(stripeKey)
  const signature = request.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  let event: Stripe.Event
  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch {
    return new Response('Invalid webhook signature', { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent

    // Camp booking — identified by metadata.booking_type
    if (intent.metadata?.booking_type === 'camp') {
      await supabase
        .from('camp_bookings')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', intent.id)
        .eq('status', 'pending')
      return new Response('ok', { status: 200 })
    }

    await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('stripe_payment_intent_id', intent.id)
      .eq('status', 'pending')

    const { data: allBookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('stripe_payment_intent_id', intent.id)
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (!error && allBookings && allBookings.length > 0) {
      const sendSummary = envFlag('EMAIL_SUMMARY_ENABLED', true)
      const sendAdminSummary = envFlag('EMAIL_ADMIN_SUMMARY_ENABLED', true)
      const sendIndividual = envFlag('EMAIL_INDIVIDUAL_ENABLED', false)

      const grouped = groupByCheckoutId(allBookings, intent.id)
      const nowIso = new Date().toISOString()

      for (const [checkoutId, bookings] of Object.entries(grouped)) {
        const first = bookings[0]
        const summaryItems = bookings.map(b => ({
          bookingId: b.id,
          classTypeId: b.class_type_id,
          bookingDate: b.booking_date,
          startTime: b.start_time,
          participants: b.participants,
          totalAmount: Number(b.total_amount),
        }))

        if (sendSummary && bookings.some(b => !b.checkout_summary_sent_at)) {
          try {
            await sendCartSummaryEmail({
              checkoutId,
              customerName: first.customer_name,
              customerEmail: first.customer_email,
              items: summaryItems,
            })

            const summaryUpdate = supabase
              .from('bookings')
              .update({ checkout_summary_sent_at: nowIso })
            if (first.checkout_id) {
              await summaryUpdate.eq('checkout_id', first.checkout_id)
            } else {
              await summaryUpdate.eq('stripe_payment_intent_id', intent.id)
            }
          } catch (error) {
            console.error('Failed to send customer checkout summary email', {
              checkoutId,
              paymentIntentId: intent.id,
              error,
            })
          }
        }

        if (sendAdminSummary && bookings.some(b => !b.checkout_admin_summary_sent_at)) {
          try {
            await sendAdminCartSummaryEmail({
              checkoutId,
              customerName: first.customer_name,
              customerEmail: first.customer_email,
              items: summaryItems,
            })

            const adminSummaryUpdate = supabase
              .from('bookings')
              .update({ checkout_admin_summary_sent_at: nowIso })
            if (first.checkout_id) {
              await adminSummaryUpdate.eq('checkout_id', first.checkout_id)
            } else {
              await adminSummaryUpdate.eq('stripe_payment_intent_id', intent.id)
            }
          } catch (error) {
            console.error('Failed to send admin checkout summary email', {
              checkoutId,
              paymentIntentId: intent.id,
              error,
            })
          }
        }

        if (sendIndividual) {
          try {
            await Promise.all([
              ...bookings.map(booking => sendConfirmationEmail({
                bookingId: booking.id,
                customerName: booking.customer_name,
                customerEmail: booking.customer_email,
                classTypeId: booking.class_type_id,
                bookingDate: booking.booking_date,
                startTime: booking.start_time,
                participants: booking.participants,
                totalAmount: Number(booking.total_amount),
              })),
              ...bookings.map(booking => sendAdminNotification({
                bookingId: booking.id,
                customerName: booking.customer_name,
                customerEmail: booking.customer_email,
                classTypeId: booking.class_type_id,
                bookingDate: booking.booking_date,
                startTime: booking.start_time,
                participants: booking.participants,
                totalAmount: Number(booking.total_amount),
              })),
            ])
          } catch (error) {
            console.error('Failed to send individual booking emails', {
              checkoutId,
              paymentIntentId: intent.id,
              error,
            })
          }
        }
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent

    if (intent.metadata?.booking_type === 'camp') {
      await supabase
        .from('camp_bookings')
        .update({ status: 'cancelled' })
        .eq('stripe_payment_intent_id', intent.id)
        .eq('status', 'pending')
    } else {
      await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('stripe_payment_intent_id', intent.id)
        .eq('status', 'pending')
    }
  }

  return new Response('ok', { status: 200 })
}
