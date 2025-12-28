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

    // Get views
    let viewsQuery = supabase
      .from('business_views')
      .select('id, viewed_at')
      .eq('business_id', businessId)

    if (startDate) {
      viewsQuery = viewsQuery.gte('viewed_at', startDate)
    }
    if (endDate) {
      viewsQuery = viewsQuery.lte('viewed_at', endDate)
    }

    const { data: views, error: viewsError } = await viewsQuery

    // Get conversions
    let conversionsQuery = supabase
      .from('conversions')
      .select('*')
      .eq('business_id', businessId)

    if (startDate) {
      conversionsQuery = conversionsQuery.gte('first_view_at', startDate)
    }
    if (endDate) {
      conversionsQuery = conversionsQuery.lte('booking_created_at', endDate)
    }

    const { data: conversions, error: conversionsError } = await conversionsQuery

    if (viewsError || conversionsError) {
      console.error('Error fetching analytics:', viewsError || conversionsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics' },
        { status: 400 }
      )
    }

    const totalViews = views?.length || 0
    const totalConversions = conversions?.length || 0
    const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0
    const avgConversionTime = conversions && conversions.length > 0
      ? conversions.reduce((sum, c) => sum + (c.conversion_time_seconds || 0), 0) / conversions.length
      : 0

    return NextResponse.json({
      success: true,
      analytics: {
        totalViews,
        totalConversions,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        avgConversionTimeSeconds: Math.round(avgConversionTime),
        conversions: conversions || [],
      },
    })
  } catch (error: any) {
    console.error('Error in conversions analytics API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

