import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createPaymentPlanSchema = z.object({
  booking_id: z.string().uuid(),
  installments: z.array(z.object({
    amount: z.number().positive(),
    due_date: z.string().datetime(),
  })).min(2),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createPaymentPlanSchema.parse(body)

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
      .select('id, total_amount, user_id')
      .eq('id', validated.booking_id)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found or access denied' },
        { status: 403 }
      )
    }

    // Validate total matches booking amount
    const totalInstallments = validated.installments.reduce((sum, inst) => sum + inst.amount, 0)
    if (Math.abs(totalInstallments - booking.total_amount) > 0.01) {
      return NextResponse.json(
        { success: false, error: 'Installment total must match booking amount' },
        { status: 400 }
      )
    }

    // Create payment plan
    const { data: paymentPlan, error: planError } = await supabase
      .from('payment_plans')
      .insert({
        booking_id: validated.booking_id,
        total_amount: booking.total_amount,
        installments: validated.installments.map(inst => ({
          ...inst,
          status: 'pending',
        })),
      })
      .select('id')
      .single()

    if (planError) {
      console.error('Error creating payment plan:', planError)
      return NextResponse.json(
        { success: false, error: planError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentPlanId: paymentPlan.id,
    })
  } catch (error: any) {
    console.error('Error in create payment plan API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment plan' },
      { status: 500 }
    )
  }
}

