import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createMessageSchema.parse(body)

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
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
        { success: false, error: 'Conversation not found or access denied' },
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
      console.error('Error creating message:', messageError)
      return NextResponse.json(
        { success: false, error: messageError.message },
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

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error: any) {
    console.error('Error in create message API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create message' },
      { status: 500 }
    )
  }
}

