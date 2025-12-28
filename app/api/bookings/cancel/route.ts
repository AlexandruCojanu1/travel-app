import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const cancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = cancelBookingSchema.parse(body)

    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get booking and verify ownership
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, user_id, status, start_date')
      .eq('id', validated.bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if booking can be cancelled (48h before start)
    const now = new Date()
    const startDate = new Date(booking.start_date)
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilStart <= 48) {
      return NextResponse.json(
        { success: false, error: 'Booking can only be cancelled 48 hours before check-in' },
        { status: 400 }
      )
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { success: false, error: `Cannot cancel booking in ${booking.status} status` },
        { status: 400 }
      )
    }

    // Update booking status to cancelled
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', validated.bookingId)

    if (updateError) {
      console.error('Error cancelling booking:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    // Note: Availability will be restored by database trigger when status changes

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in cancel booking API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}

