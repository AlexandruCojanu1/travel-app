import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createConversationSchema = z.object({
  type: z.enum(['booking', 'support', 'general']),
  business_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createConversationSchema.parse(body)

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get business owner
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('owner_user_id')
      .eq('id', validated.business_id)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      )
    }

    // Check if conversation already exists
    let query = supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .eq('business_id', validated.business_id)
      .eq('type', validated.type)

    if (validated.booking_id) {
      query = query.eq('booking_id', validated.booking_id)
    }

    const { data: existing } = await query.single()

    if (existing) {
      return NextResponse.json({
        success: true,
        conversationId: existing.id,
        isNew: false,
      })
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        type: validated.type,
        business_id: validated.business_id,
        booking_id: validated.booking_id || null,
        user_id: user.id,
        business_user_id: business.owner_user_id,
      })
      .select('id')
      .single()

    if (convError) {
      console.error('Error creating conversation:', convError)
      return NextResponse.json(
        { success: false, error: convError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      isNew: true,
    })
  } catch (error: any) {
    console.error('Error in create conversation API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

