import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const { data: loyalty, error } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching loyalty points:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // If no record exists, return default
    if (!loyalty) {
      return NextResponse.json({
        success: true,
        loyalty: {
          points: 0,
          tier: 'bronze',
          lifetime_points: 0,
        },
      })
    }

    return NextResponse.json({
      success: true,
      loyalty,
    })
  } catch (error: any) {
    console.error('Error in get loyalty points API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch loyalty points' },
      { status: 500 }
    )
  }
}

