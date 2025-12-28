import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const addCollaboratorSchema = z.object({
  trip_id: z.string().uuid(),
  user_email: z.string().email(),
  role: z.enum(['viewer', 'editor']).default('editor'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = addCollaboratorSchema.parse(body)

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Verify user owns the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('id', validated.trip_id)
      .eq('user_id', user.id)
      .single()

    if (tripError || !trip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found or access denied' },
        { status: 403 }
      )
    }

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', validated.user_email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User not found with this email' },
        { status: 404 }
      )
    }

    if (profile.id === user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot add yourself as a collaborator' },
        { status: 400 }
      )
    }

    // Add collaborator
    const { data: collaborator, error: collabError } = await supabase
      .from('trip_collaborators')
      .insert({
        trip_id: validated.trip_id,
        user_id: profile.id,
        role: validated.role,
        added_by_user_id: user.id,
      })
      .select('id')
      .single()

    if (collabError) {
      console.error('Error adding collaborator:', collabError)
      return NextResponse.json(
        { success: false, error: collabError.message },
        { status: 400 }
      )
    }

    // Create notification for collaborator
    await supabase.rpc('create_notification', {
      p_user_id: profile.id,
      p_type: 'trip_shared',
      p_title: 'Trip Shared with You',
      p_message: `You've been added as a ${validated.role} to a trip`,
      p_data: { trip_id: validated.trip_id },
    })

    return NextResponse.json({
      success: true,
      collaboratorId: collaborator.id,
    })
  } catch (error: any) {
    console.error('Error in add collaborator API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add collaborator' },
      { status: 500 }
    )
  }
}

