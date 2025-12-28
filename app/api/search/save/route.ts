import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const saveSearchSchema = z.object({
  city_id: z.string().uuid().optional(),
  search_query: z.string().optional(),
  filters: z.record(z.any()).optional(),
  name: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = saveSearchSchema.parse(body)

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const { data: savedSearch, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: user.id,
        city_id: validated.city_id || null,
        search_query: validated.search_query || null,
        filters: validated.filters || null,
        name: validated.name,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error saving search:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      searchId: savedSearch.id,
    })
  } catch (error: any) {
    console.error('Error in save search API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save search' },
      { status: 500 }
    )
  }
}

