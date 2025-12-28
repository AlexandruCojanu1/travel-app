import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('business_id')

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'business_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: policies, error } = await supabase
      .from('cancellation_policies')
      .select('*')
      .or(`business_id.eq.${businessId},business_id.is.null`)
      .order('free_cancellation_hours', { ascending: false })

    if (error) {
      console.error('Error fetching cancellation policies:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      policies: policies || [],
    })
  } catch (error: any) {
    console.error('Error in cancellation policies API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch policies' },
      { status: 500 }
    )
  }
}

