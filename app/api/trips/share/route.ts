import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { logger } from '@/lib/logger'
import { success, failure, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

const shareTripSchema = z.object({
  trip_id: z.string().uuid(),
  access_level: z.enum(['view', 'edit']).default('view'),
  is_public: z.boolean().default(false),
  expires_at: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = shareTripSchema.parse(body)

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        failure('User not authenticated', 'UNAUTHORIZED'),
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
        failure('Trip not found or access denied', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    // Generate share token
    const shareToken = randomBytes(32).toString('hex')

    // Create share
    const { data: share, error: shareError } = await supabase
      .from('trip_shares')
      .insert({
        trip_id: validated.trip_id,
        shared_by_user_id: user.id,
        share_token: shareToken,
        access_level: validated.access_level,
        is_public: validated.is_public,
        expires_at: validated.expires_at || null,
      })
      .select('id, share_token')
      .single()

    if (shareError) {
      logger.error('Error creating share', shareError, { userId: user.id, tripId: validated.trip_id })
      return NextResponse.json(
        failure(shareError.message, 'SHARE_CREATE_ERROR'),
        { status: 400 }
      )
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/trips/shared/${shareToken}`

    return NextResponse.json(success({
      shareId: share.id,
      shareToken: share.share_token,
      shareUrl,
    }))
  } catch (error: unknown) {
    logger.error('Error in share trip API', error)

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

