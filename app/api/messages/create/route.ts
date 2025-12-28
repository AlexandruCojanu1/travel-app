import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { success, failure, handleApiError } from '@/lib/api-response'
import { checkRateLimit, RateLimitConfigs } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const createMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - messages can be sent frequently
    const rateLimitResult = await checkRateLimit(
      request,
      RateLimitConfigs.moderate
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        failure('Rate limit exceeded. Please try again later.', 'RATE_LIMIT_EXCEEDED'),
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }

    const body = await request.json()
    const validated = createMessageSchema.parse(body)

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
      RateLimitConfigs.moderate,
      user.id
    )

    if (!userRateLimitResult.success) {
      return NextResponse.json(
        failure('Rate limit exceeded. Please try again later.', 'RATE_LIMIT_EXCEEDED'),
        {
          status: 429,
          headers: {
            'Retry-After': userRateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(userRateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }

    // Verify user is part of this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', validated.conversation_id)
      .or(`user_id.eq.${user.id},business_user_id.eq.${user.id}`)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        failure('Conversation not found or access denied', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: validated.conversation_id,
        sender_id: user.id,
        content: validated.content,
      })
      .select('*')
      .single()

    if (messageError) {
      logger.error('Error creating message', messageError, { userId: user.id, conversationId: validated.conversation_id })
      return NextResponse.json(
        failure(messageError.message, 'MESSAGE_CREATE_ERROR'),
        { status: 400 }
      )
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', validated.conversation_id)

    // Create notification for recipient
    const recipientId = conversation.user_id === user.id 
      ? conversation.business_user_id 
      : conversation.user_id

    if (recipientId) {
      await supabase.rpc('create_notification', {
        p_user_id: recipientId,
        p_type: 'message',
        p_title: 'New Message',
        p_message: validated.content.substring(0, 100),
        p_data: { conversation_id: validated.conversation_id },
      })
    }

    return NextResponse.json(
      success({ message }),
      {
        headers: {
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': userRateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(userRateLimitResult.resetTime).toISOString(),
        },
      }
    )
  } catch (error: unknown) {
    logger.error('Error in create message API', error)

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

