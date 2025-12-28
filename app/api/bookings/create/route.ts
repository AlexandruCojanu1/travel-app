import { createClient } from '@/lib/supabase/server'
import { checkAvailability, getResourceDetails } from '@/services/booking/booking.service'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { success, failure, handleApiError } from '@/lib/api-response'
import { checkRateLimit, RateLimitConfigs } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const createBookingSchema = z.object({
    resource_id: z.string().uuid(),
    business_id: z.string().uuid(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    guest_count: z.number().int().min(1).max(20),
})

export async function POST(request: NextRequest) {
    try {
        // Rate limiting - check before processing
        const rateLimitResult = await checkRateLimit(
            request,
            RateLimitConfigs.payment,
            undefined // Will use IP if not authenticated yet
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

        // Validate input
        const validated = createBookingSchema.parse(body)

        // Create Supabase client
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                failure('User not authenticated', 'UNAUTHORIZED'),
                { status: 401 }
            )
        }

        // Re-check rate limit with user ID (more accurate)
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

        // Step 1: Check availability
        const availability = await checkAvailability(
            validated.resource_id,
            validated.start_date,
            validated.end_date
        )

        if (!availability.available) {
            return NextResponse.json(
                failure(availability.error || 'Resource not available', 'UNAVAILABLE'),
                { status: 400 }
            )
        }

        // Step 2: Get resource details and calculate price
        const resourceResult = await getResourceDetails(validated.resource_id)

        if (!resourceResult.success || !resourceResult.resource) {
            return NextResponse.json(
                failure('Resource not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        const resource = resourceResult.resource
        const pricePerNight = resource.price_per_night || 0

        // Calculate number of nights
        const start = new Date(validated.start_date)
        const end = new Date(validated.end_date)
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

        // Calculate total amount
        const totalAmount = pricePerNight * nights

        // Step 3: Create booking with 'awaiting_payment' status
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .insert({
                user_id: user.id,
                business_id: validated.business_id,
                resource_id: validated.resource_id,
                start_date: validated.start_date,
                end_date: validated.end_date,
                guest_count: validated.guest_count,
                total_amount: totalAmount,
                status: 'awaiting_payment',
            })
            .select('id')
            .single()

        if (bookingError) {
            logger.error('Error creating booking', bookingError, { userId: user.id, resourceId: validated.resource_id })
            return NextResponse.json(
                failure(bookingError.message, 'BOOKING_ERROR'),
                { status: 400 }
            )
        }

        if (!booking) {
            return NextResponse.json(
                failure('Failed to create booking', 'BOOKING_ERROR'),
                { status: 500 }
            )
        }

        // Step 4: Return booking ID for checkout
        return NextResponse.json(
            success({
                bookingId: booking.id,
                totalAmount,
            })
        )
    } catch (error: unknown) {
        logger.error('Error in create booking API', error)

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

