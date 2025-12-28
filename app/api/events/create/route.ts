import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createEventSchema = z.object({
  city_id: z.string().uuid(),
  business_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  location_name: z.string().optional(),
  location_address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  image_url: z.string().url().optional(),
  price_min: z.number().optional(),
  price_max: z.number().optional(),
  website_url: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createEventSchema.parse(body)

    // Validate date range
    if (new Date(validated.end_date) <= new Date(validated.start_date)) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        ...validated,
        created_by_user_id: user.id,
      })
      .select('id')
      .single()

    if (eventError) {
      console.error('Error creating event:', eventError)
      return NextResponse.json(
        { success: false, error: eventError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      eventId: event.id,
    })
  } catch (error: any) {
    console.error('Error in create event API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create event' },
      { status: 500 }
    )
  }
}

