import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { success, failure, handleApiError } from '@/lib/api-response'
import { checkRateLimit, RateLimitConfigs } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const createReviewSchema = z.object({
  business_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  rating_cleanliness: z.number().int().min(1).max(5).optional(),
  rating_service: z.number().int().min(1).max(5).optional(),
  rating_value: z.number().int().min(1).max(5).optional(),
  rating_location: z.number().int().min(1).max(5).optional(),
  photos: z.array(z.string().url()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      RateLimitConfigs.standard
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
    const validated = createReviewSchema.parse(body)

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        failure('User not authenticated', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

    // Re-check with user ID
    const userRateLimitResult = await checkRateLimit(
      request,
      RateLimitConfigs.standard,
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

    // Verify user has a confirmed booking for this business
    if (validated.booking_id) {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, status, business_id, user_id')
        .eq('id', validated.booking_id)
        .eq('user_id', user.id)
        .eq('business_id', validated.business_id)
        .eq('status', 'confirmed')
        .single()

      if (bookingError || !booking) {
        return NextResponse.json(
          failure('No confirmed booking found for this business', 'NO_BOOKING'),
          { status: 403 }
        )
      }
    } else {
      // If no booking_id provided, check if user has any confirmed booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', validated.business_id)
        .eq('status', 'confirmed')
        .limit(1)
        .single()

      if (bookingError || !booking) {
        return NextResponse.json(
          failure('You must have a confirmed booking to leave a review', 'NO_BOOKING'),
          { status: 403 }
        )
      }
    }

    // Check if user already reviewed this business
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('business_id', validated.business_id)
      .single()

    if (existingReview) {
      return NextResponse.json(
        failure('You have already reviewed this business', 'DUPLICATE_REVIEW'),
        { status: 400 }
      )
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        business_id: validated.business_id,
        booking_id: validated.booking_id || null,
        rating: validated.rating,
        comment: validated.comment || null,
        rating_cleanliness: validated.rating_cleanliness || null,
        rating_service: validated.rating_service || null,
        rating_value: validated.rating_value || null,
        rating_location: validated.rating_location || null,
        photos: validated.photos || null,
        is_verified: validated.booking_id ? true : false,
      })
      .select('id')
      .single()

    if (reviewError) {
      logger.error('Error creating review', reviewError, { userId: user.id, businessId: validated.business_id })
      return NextResponse.json(
        failure(reviewError.message, 'REVIEW_CREATE_ERROR'),
        { status: 400 }
      )
    }

    // Create notification for business owner
    const { data: business } = await supabase
      .from('businesses')
      .select('owner_user_id, name')
      .eq('id', validated.business_id)
      .single()

    if (business && business.owner_user_id) {
      await supabase.rpc('create_notification', {
        p_user_id: business.owner_user_id,
        p_type: 'review_received',
        p_title: 'New Review Received',
        p_message: `You received a ${validated.rating}-star review for ${business.name}`,
        p_data: { review_id: review.id, business_id: validated.business_id },
      })
    }

    return NextResponse.json(
      success({ reviewId: review.id }),
      {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': userRateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(userRateLimitResult.resetTime).toISOString(),
        },
      }
    )
  } catch (error: unknown) {
    logger.error('Error in create review API', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        failure('Invalid input data', 'VALIDATION_ERROR', error.errors),
        { status: 400 }
      )
    }

    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    )
  }
}

