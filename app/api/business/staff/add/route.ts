import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const addStaffSchema = z.object({
  business_id: z.string().uuid(),
  user_email: z.string().email(),
  role: z.enum(['manager', 'staff', 'viewer']),
  permissions: z.record(z.boolean()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = addStaffSchema.parse(body)

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Verify user owns the business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', validated.business_id)
      .eq('owner_user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found or access denied' },
        { status: 403 }
      )
    }

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', validated.user_email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User not found with this email' },
        { status: 404 }
      )
    }

    if (profile.id === user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot add yourself as staff' },
        { status: 400 }
      )
    }

    // Add staff member
    const { data: staff, error: staffError } = await supabase
      .from('business_staff')
      .insert({
        business_id: validated.business_id,
        user_id: profile.id,
        role: validated.role,
        permissions: validated.permissions || {},
        added_by_user_id: user.id,
      })
      .select('id')
      .single()

    if (staffError) {
      console.error('Error adding staff:', staffError)
      return NextResponse.json(
        { success: false, error: staffError.message },
        { status: 400 }
      )
    }

    // Create notification for new staff member
    await supabase.rpc('create_notification', {
      p_user_id: profile.id,
      p_type: 'message',
      p_title: 'Added to Business Team',
      p_message: `You've been added as ${validated.role} to a business`,
      p_data: { business_id: validated.business_id },
    })

    return NextResponse.json({
      success: true,
      staffId: staff.id,
    })
  } catch (error: any) {
    console.error('Error in add staff API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add staff' },
      { status: 500 }
    )
  }
}

