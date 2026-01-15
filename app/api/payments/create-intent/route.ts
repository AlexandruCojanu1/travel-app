import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getBookingById } from '@/services/booking/booking.service'
import { logger } from '@/lib/logger'
import { success, failure, handleApiError } from '@/lib/api-response'
import { checkRateLimit, RateLimitConfigs } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - critical for payment endpoints
    const rateLimitResult = await checkRateLimit(
      request,
      RateLimitConfigs.payment
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        failure('Rate limit exceeded. Please try again later.', 'RATE_LIMIT_EXCEEDED'),
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }

    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json(
        failure('Missing bookingId', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        failure('User not authenticated', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

    // Re-check rate limit with user ID
    const userRateLimitResult = await checkRateLimit(
      request,
      RateLimitConfigs.payment,
      user.id
    )

    if (!userRateLimitResult.success) {
      return NextResponse.json(
        failure('Rate limit exceeded. Please try again later.', 'RATE_LIMIT_EXCEEDED'),
        {
          status: 429,
          headers: {
            'Retry-After': userRateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(userRateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }

    // Get booking details
    const booking = await getBookingById(bookingId)

    if (!booking) {
      return NextResponse.json(
        failure('Booking not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Verify booking belongs to user
    if (booking.user_id !== user.id) {
      return NextResponse.json(
        failure('Unauthorized', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    // Verify booking is in correct status
    if (booking.status !== 'pending') {
      return NextResponse.json(
        failure(`Booking is in ${booking.status} status`, 'INVALID_STATUS'),
        { status: 400 }
      )
    }

    // Initialize Stripe
    let stripe
    try {
      stripe = getStripe()
    } catch (stripeError: unknown) {
      logger.error('Stripe initialization error', stripeError, { userId: user.id, bookingId })
      return NextResponse.json(
        failure('Payment system not configured. Please set STRIPE_SECRET_KEY.', 'STRIPE_CONFIG_ERROR'),
        { status: 500 }
      )
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.total_price * 100), // Convert to cents
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

    return NextResponse.json(
      success({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': userRateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(userRateLimitResult.resetTime).toISOString(),
        },
      }
    )
  } catch (error: unknown) {
    logger.error('Error creating payment intent', error)
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    )
  }
}

