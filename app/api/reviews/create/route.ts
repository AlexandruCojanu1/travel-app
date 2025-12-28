import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

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
    const body = await request.json()
    const validated = createReviewSchema.parse(body)

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
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
          { success: false, error: 'No confirmed booking found for this business' },
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
          { success: false, error: 'You must have a confirmed booking to leave a review' },
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
        { success: false, error: 'You have already reviewed this business' },
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
      console.error('Error creating review:', reviewError)
      return NextResponse.json(
        { success: false, error: reviewError.message },
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

    return NextResponse.json({
      success: true,
      reviewId: review.id,
    })
  } catch (error: any) {
    console.error('Error in create review API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create review' },
      { status: 500 }
    )
  }
}

