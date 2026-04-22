export const prerender = false

import type { APIRoute } from 'astro'
import Stripe from 'stripe'
import { supabase } from '../../../lib/supabase'
import { sendConfirmationEmail, sendAdminNotification } from '../../../lib/emailService'

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

    // Confirm all bookings linked to this payment intent
    const { data: bookings } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('stripe_payment_intent_id', intent.id)
      .eq('status', 'pending')
      .select('*')

    if (bookings && bookings.length > 0) {
      await Promise.all([
        ...bookings.map(booking => sendConfirmationEmail({
          bookingId: booking.id,
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
          classTypeId: booking.class_type_id,
          bookingDate: booking.booking_date,
          startTime: booking.start_time,
          participants: booking.participants,
          totalAmount: booking.total_amount,
        })),
        ...bookings.map(booking => sendAdminNotification({
          bookingId: booking.id,
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
          classTypeId: booking.class_type_id,
          bookingDate: booking.booking_date,
          startTime: booking.start_time,
          participants: booking.participants,
          totalAmount: booking.total_amount,
        })),
      ]).catch(() => {}) // don't fail webhook on email error
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent
    await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('stripe_payment_intent_id', intent.id)
      .eq('status', 'pending')
  }

  return new Response('ok', { status: 200 })
}
