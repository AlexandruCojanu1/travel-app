import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('city_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!cityId) {
      return NextResponse.json(
        { success: false, error: 'city_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    let query = supabase
      .from('events')
      .select('*')
      .eq('city_id', cityId)
      .order('start_date', { ascending: true })
      .range(offset, offset + limit - 1)

    if (startDate) {
      query = query.gte('start_date', startDate)
    }

    if (endDate) {
      query = query.lte('end_date', endDate)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      events: events || [],
    })
  } catch (error: any) {
    console.error('Error in list events API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

