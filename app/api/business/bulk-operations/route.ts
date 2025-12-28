import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bulkOperationSchema = z.object({
  business_id: z.string().uuid(),
  operation_type: z.enum(['price_update', 'availability_block', 'availability_unblock']),
  resource_ids: z.array(z.string().uuid()).optional(),
  dates: z.array(z.string()).optional(),
  price: z.number().optional(),
  details: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = bulkOperationSchema.parse(body)

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
      .eq('id', validated.business_id)
      .eq('owner_user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found or access denied' },
        { status: 403 }
      )
    }

    let affectedCount = 0

    // Perform bulk operation based on type
    if (validated.operation_type === 'price_update' && validated.resource_ids && validated.price) {
      // Update prices for multiple resources
      for (const resourceId of validated.resource_ids) {
        const { error } = await supabase
          .from('business_resources')
          .update({ price_per_night: validated.price })
          .eq('id', resourceId)
          .eq('business_id', validated.business_id)

        if (!error) {
          affectedCount++
        }
      }
    } else if (validated.operation_type === 'availability_block' && validated.resource_ids && validated.dates) {
      // Block dates for multiple resources
      for (const resourceId of validated.resource_ids) {
        for (const date of validated.dates) {
          const { error } = await supabase
            .from('resource_availability')
            .upsert({
              resource_id: resourceId,
              date,
              is_available: false,
            })

          if (!error) {
            affectedCount++
          }
        }
      }
    }

    // Log the operation
    await supabase
      .from('bulk_operations')
      .insert({
        business_id: validated.business_id,
        user_id: user.id,
        operation_type: validated.operation_type,
        affected_count: affectedCount,
        details: validated.details || {},
        status: 'completed',
        completed_at: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      affectedCount,
    })
  } catch (error: any) {
    console.error('Error in bulk operation API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}

