import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('city_id')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!cityId) {
      return NextResponse.json(
        { success: false, error: 'city_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    let query = supabase
      .from('travel_guides')
      .select(`
        *,
        sections:guide_sections (*),
        tips:guide_tips (*)
      `)
      .eq('city_id', cityId)
      .order('is_featured', { ascending: false })
      .order('view_count', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }

    const { data: guides, error } = await query

    if (error) {
      console.error('Error fetching guides:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      guides: guides || [],
    })
  } catch (error: any) {
    console.error('Error in list guides API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch guides' },
      { status: 500 }
    )
  }
}

