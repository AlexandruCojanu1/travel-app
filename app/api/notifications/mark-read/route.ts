import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, markAll } = body

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    if (markAll) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all as read:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
    } else if (notificationId) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error marking notification as read:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'notificationId or markAll is required' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in mark read API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to mark as read' },
      { status: 500 }
    )
  }
}

