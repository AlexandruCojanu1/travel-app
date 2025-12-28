import { createClient } from '@/lib/supabase/server'
import { checkAvailability, getResourceDetails } from '@/services/booking/booking.service'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

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
        const body = await request.json()

        // Validate input
        const validated = createBookingSchema.parse(body)

        // Create Supabase client
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { success: false, error: 'User not authenticated' },
                { status: 401 }
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
                { success: false, error: availability.error || 'Resource not available' },
                { status: 400 }
            )
        }

        // Step 2: Get resource details and calculate price
        const resourceResult = await getResourceDetails(validated.resource_id)

        if (!resourceResult.success || !resourceResult.resource) {
            return NextResponse.json(
                { success: false, error: 'Resource not found' },
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
            console.error('Error creating booking:', bookingError)
            return NextResponse.json(
                { success: false, error: bookingError.message },
                { status: 400 }
            )
        }

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Failed to create booking' },
                { status: 500 }
            )
        }

        // Step 4: Return booking ID for checkout
        return NextResponse.json({
            success: true,
            bookingId: booking.id,
            totalAmount,
        })
    } catch (error: any) {
        console.error('Error in create booking API:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create booking' },
            { status: 500 }
        )
    }
}

