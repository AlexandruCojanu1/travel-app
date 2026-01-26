import { Router, raw } from 'express'
import { stripe } from '../lib/stripe.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { logger } from '../lib/logger.js'

export const webhookRouter = Router()

// Stripe webhook - needs raw body
webhookRouter.post('/stripe', raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    logger.error('Missing Stripe signature or webhook secret')
    return res.status(400).json({ error: 'Missing signature' })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    logger.error('Webhook signature verification failed', err)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      default:
        logger.info(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    logger.error('Webhook handler error', error)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
})

async function handlePaymentSuccess(paymentIntent: any) {
  const { booking_id, user_id } = paymentIntent.metadata

  if (!booking_id) {
    logger.warn('Payment succeeded but no booking_id in metadata')
    return
  }

  // Update booking status
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      payment_intent_id: paymentIntent.id,
      paid_at: new Date().toISOString(),
    })
    .eq('id', booking_id)

  if (error) {
    logger.error('Failed to update booking after payment', error, { booking_id })
  } else {
    logger.info('Booking confirmed after payment', { booking_id, payment_intent: paymentIntent.id })
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  const { booking_id } = paymentIntent.metadata

  if (!booking_id) {
    return
  }

  // Update booking status
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({
      payment_status: 'failed',
      payment_error: paymentIntent.last_payment_error?.message,
    })
    .eq('id', booking_id)

  if (error) {
    logger.error('Failed to update booking after payment failure', error, { booking_id })
  } else {
    logger.info('Booking marked as payment failed', { booking_id })
  }
}
