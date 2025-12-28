import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('business_id')
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!businessId && !userId) {
      return NextResponse.json(
        { success: false, error: 'business_id or user_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:profiles!reviews_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      reviews: reviews || [],
    })
  } catch (error: any) {
    console.error('Error in list reviews API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

