import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createGroupBookingSchema = z.object({
  booking_id: z.string().uuid(),
  group_name: z.string().optional(),
  total_guests: z.number().int().min(2),
  member_emails: z.array(z.string().email()).min(1),
  discount_percentage: z.number().int().min(0).max(50).default(0),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createGroupBookingSchema.parse(body)

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Verify booking belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, business_id, total_amount, user_id')
      .eq('id', validated.booking_id)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found or access denied' },
        { status: 403 }
      )
    }

    // Calculate discounted amount
    const discountAmount = (booking.total_amount * validated.discount_percentage) / 100
    const discountedTotal = booking.total_amount - discountAmount
    const amountPerMember = discountedTotal / validated.total_guests

    // Create group booking
    const { data: groupBooking, error: groupError } = await supabase
      .from('group_bookings')
      .insert({
        booking_id: validated.booking_id,
        group_leader_user_id: user.id,
        group_name: validated.group_name || null,
        total_guests: validated.total_guests,
        discount_percentage: validated.discount_percentage,
      })
      .select('id')
      .single()

    if (groupError) {
      console.error('Error creating group booking:', groupError)
      return NextResponse.json(
        { success: false, error: groupError.message },
        { status: 400 }
      )
    }

    // Add group members
    const members = []
    for (const email of validated.member_emails) {
      // Find user by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profile) {
        const { data: member, error: memberError } = await supabase
          .from('group_booking_members')
          .insert({
            group_booking_id: groupBooking.id,
            user_id: profile.id,
            amount_owed: amountPerMember,
          })
          .select('id')
          .single()

        if (!memberError) {
          members.push(member)
        }
      }
    }

    // Add leader as member
    await supabase
      .from('group_booking_members')
      .insert({
        group_booking_id: groupBooking.id,
        user_id: user.id,
        amount_owed: amountPerMember,
        amount_paid: amountPerMember, // Leader pays immediately
        payment_status: 'paid',
      })

    return NextResponse.json({
      success: true,
      groupBookingId: groupBooking.id,
      amountPerMember: parseFloat(amountPerMember.toFixed(2)),
      members: members.length + 1, // +1 for leader
    })
  } catch (error: any) {
    console.error('Error in create group booking API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create group booking' },
      { status: 500 }
    )
  }
}

