import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getBookingDetails } from '@/services/booking/booking.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId } = body
    
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Missing bookingId' },
        { status: 400 }
      )
    }
    
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }
    
    // Get booking details
    const bookingResult = await getBookingDetails(bookingId)
    
    if (!bookingResult.success || !bookingResult.booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }
    
    const booking = bookingResult.booking
    
    // Verify booking belongs to user
    if (booking.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    // Verify booking is in correct status
    if (booking.status !== 'awaiting_payment') {
      return NextResponse.json(
        { success: false, error: `Booking is in ${booking.status} status` },
        { status: 400 }
      )
    }
    
    // Initialize Stripe
    let stripe
    try {
      stripe = getStripe()
    } catch (stripeError: any) {
      console.error('Stripe initialization error:', stripeError)
      return NextResponse.json(
        { success: false, error: 'Payment system not configured. Please set STRIPE_SECRET_KEY.' },
        { status: 500 }
      )
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.total_amount * 100), // Convert to cents
      currency: 'ron',
      metadata: {
        bookingId: booking.id,
        userId: user.id,
        businessId: booking.business_id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })
    
    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}

