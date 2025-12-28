import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('business_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'business_id is required' },
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

    // Verify user owns the business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('owner_user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found or access denied' },
        { status: 403 }
      )
    }

    // Get demographics data
    let query = supabase
      .from('business_demographics')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: false })
      .limit(30)

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: demographics, error } = await query

    if (error) {
      console.error('Error fetching demographics:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Aggregate data
    const aggregated = demographics?.reduce((acc, item) => {
      acc.age_18_25 += item.age_group_18_25 || 0
      acc.age_26_35 += item.age_group_26_35 || 0
      acc.age_36_45 += item.age_group_36_45 || 0
      acc.age_46_55 += item.age_group_46_55 || 0
      acc.age_56_plus += item.age_group_56_plus || 0
      return acc
    }, {
      age_18_25: 0,
      age_26_35: 0,
      age_36_45: 0,
      age_46_55: 0,
      age_56_plus: 0,
    }) || {
      age_18_25: 0,
      age_26_35: 0,
      age_36_45: 0,
      age_46_55: 0,
      age_56_plus: 0,
    }

    return NextResponse.json({
      success: true,
      demographics: aggregated,
      dailyData: demographics || [],
    })
  } catch (error: any) {
    console.error('Error in demographics analytics API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch demographics' },
      { status: 500 }
    )
  }
}

