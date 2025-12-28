import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { success, failure, handleApiError } from '@/lib/api-response'
import { checkRateLimit, RateLimitConfigs } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const createConversationSchema = z.object({
  type: z.enum(['booking', 'support', 'general']),
  business_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      RateLimitConfigs.standard
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        failure('Rate limit exceeded. Please try again later.', 'RATE_LIMIT_EXCEEDED'),
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }

    const body = await request.json()
    const validated = createConversationSchema.parse(body)

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        failure('User not authenticated', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

    // Re-check with user ID
    const userRateLimitResult = await checkRateLimit(
      request,
      RateLimitConfigs.standard,
      user.id
    )

    if (!userRateLimitResult.success) {
      return NextResponse.json(
        failure('Rate limit exceeded. Please try again later.', 'RATE_LIMIT_EXCEEDED'),
        {
          status: 429,
          headers: {
            'Retry-After': userRateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(userRateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }

    // Get business owner
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('owner_user_id')
      .eq('id', validated.business_id)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        failure('Business not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Check if conversation already exists
    let query = supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .eq('business_id', validated.business_id)
      .eq('type', validated.type)

    if (validated.booking_id) {
      query = query.eq('booking_id', validated.booking_id)
    }

    const { data: existing } = await query.single()

    if (existing) {
      return NextResponse.json(success({
        conversationId: existing.id,
        isNew: false,
      }))
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        type: validated.type,
        business_id: validated.business_id,
        booking_id: validated.booking_id || null,
        user_id: user.id,
        business_user_id: business.owner_user_id,
      })
      .select('id')
      .single()

    if (convError) {
      logger.error('Error creating conversation', convError, { userId: user.id, businessId: validated.business_id })
      return NextResponse.json(
        failure(convError.message, 'CONVERSATION_CREATE_ERROR'),
        { status: 400 }
      )
    }

    return NextResponse.json(
      success({
        conversationId: conversation.id,
        isNew: true,
      }),
      {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': userRateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(userRateLimitResult.resetTime).toISOString(),
        },
      }
    )
  } catch (error: unknown) {
    logger.error('Error in create conversation API', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        failure('Invalid input data', 'VALIDATION_ERROR', error.errors),
        { status: 400 }
      )
    }

    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    )
  }
}

