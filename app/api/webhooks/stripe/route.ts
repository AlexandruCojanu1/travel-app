import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

/**
 * Stripe Webhook Handler
 * Critical: This is the ONLY source of truth for payment confirmation
 * Only updates booking status when Stripe confirms payment succeeded
 */
export async function POST(req: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook secret is set
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Step 1: Verify the signature
    let event
    try {
      const stripe = getStripe()
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Step 2: Handle payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Extract bookingId from metadata
      const bookingId = paymentIntent.metadata?.bookingId

      if (!bookingId) {
        console.error('No bookingId in payment intent metadata')
        return NextResponse.json(
          { error: 'Missing bookingId in metadata' },
          { status: 400 }
        )
      }

      // Step 3: Database transaction
      const supabase = await createClient()

      // Update booking status to 'confirmed'
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId)
        .eq('status', 'awaiting_payment') // Only update if still awaiting payment

      if (updateError) {
        console.error('Error updating booking:', updateError)
        return NextResponse.json(
          { error: 'Failed to update booking' },
          { status: 500 }
        )
      }

      // Step 4: Log payment in payments table
      const amount = paymentIntent.amount / 100 // Convert from cents to RON

      const { error: paymentLogError } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingId,
          provider: 'stripe',
          status: 'succeeded',
          amount: amount,
          currency: paymentIntent.currency,
          transaction_id: paymentIntent.id,
          metadata: paymentIntent.metadata,
        })

      if (paymentLogError) {
        console.error('Error logging payment:', paymentLogError)
        // Don't fail the webhook if payment log fails
        // The booking is already confirmed
      }

      // Note: The SQL trigger trg_decrement_availability will fire automatically
      // when the booking status changes to 'confirmed'

      console.log(`Booking ${bookingId} confirmed via Stripe webhook`)
    }

    // Acknowledge receipt to Stripe
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

