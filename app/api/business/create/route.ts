import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { businessSchema, type BusinessInput } from '@/lib/validations/business'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { success, failure, handleApiError } from '@/lib/api-response'
import { checkRateLimit, RateLimitConfigs } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Map category to business_type enum
const CATEGORY_TO_TYPE_MAP: Record<string, string> = {
  'Restaurant': 'restaurant',
  'Cafe': 'cafe',
  'Hotel': 'hotel',
  'Spa': 'spa',
  'AmusementPark': 'amusement_park',
  'Shop': 'shop',
  'Mall': 'mall',
  'Museum': 'museum',
  'Event': 'event',
  'Theater': 'theater',
  'Nature': 'nature',
  'CurrencyExchange': 'currency_exchange',
  'Parking': 'parking',
  'Laundry': 'laundry',
  'DutyFree': 'duty_free',
  'Hospital': 'hospital',
  'Pharmacy': 'pharmacy',
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent abuse
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
    const { data, userId } = body as { data: BusinessInput; userId?: string }

    // Validate input
    const validated = businessSchema.parse(data)

    // Create Supabase client
    const supabase = await createClient()

    // Get authenticated user - CRITICAL: Must get user to ensure session is available for RLS
    let user = null
    let authError = null

    // Always try to get user from session first (required for RLS)
    const { data: { user: sessionUser }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      logger.error('API: Auth error', userError)
      authError = userError
    } else if (sessionUser) {
      user = sessionUser
      logger.log('API: User authenticated from session', { userId: user.id })
    }

    // If userId is provided, verify it matches the session
    if (userId) {
      if (user && user.id === userId) {
        logger.log('API: Provided userId matches session', { userId })
      } else if (!user) {
        // Session failed but userId provided - use it as fallback
        user = { id: userId } as { id: string }
        logger.log('API: Using provided userId as fallback (session failed)', { userId })
      } else {
        logger.warn('API: Provided userId does not match session user', { providedUserId: userId, sessionUserId: user.id })
      }
    }

    if (!user) {
      logger.error('API: No user found', authError)
      return NextResponse.json(
        failure('User not authenticated. Please log in again.', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

    logger.log('API: User authenticated', { userId: user.id })

    // Note: getSession() may not work in API routes, but getUser() should be enough for RLS
    // RLS policy checks auth.uid() which is available if getUser() succeeds
    // Try to refresh session to ensure it's available for RLS
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        logger.log('API: Session available for RLS', { userId: session.user.id })
      } else {
        logger.warn('API: No session from getSession(), but user is authenticated. RLS should still work with auth.uid()')
      }
    } catch (e) {
      logger.warn('API: Could not get session, but user is authenticated. Proceeding.', { error: e })
    }

    // Initialize insertClient (using service role to bypass RLS/foreign key issues)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let insertClient = supabase

    if (serviceRoleKey) {
      insertClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      )
      logger.log('API: Using service role client for insert')
    }

    // Verify or Create Profile (Required for foreign key constraint)
    try {
      const { data: profile } = await insertClient
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile) {
        logger.log('API: Profile missing, creating minimal profile', { userId: user.id })

        // Extract a name from email if possible, else use a default
        const userEmail = (user as any).email || 'business.owner'
        const displayName = userEmail.split('@')[0].replace(/[._]/g, ' ')

        const { error: createProfileError } = await insertClient
          .from('profiles')
          .insert({
            id: user.id,
            full_name: displayName,
            role: 'local', // Must be 'tourist' or 'local' per DB check constraint
            xp: 0,
            coins: 0,
            level: 1
          })

        if (createProfileError) {
          logger.error('API: Failed to create essential profile', createProfileError)
          return NextResponse.json(
            failure(`Could not create user profile: ${createProfileError.message}`, 'PROFILE_CREATE_ERROR'),
            { status: 400 }
          )
        }
      }
    } catch (e: any) {
      logger.error('API: Error checking/creating profile', e)
      return NextResponse.json(
        failure(`Profile verification error: ${e.message}`, 'PROFILE_CHECK_ERROR'),
        { status: 500 }
      )
    }

    // Map category to type enum
    const businessType = CATEGORY_TO_TYPE_MAP[validated.category] || 'restaurant'

    // Prepare attributes JSONB
    const attributes: Record<string, any> = {
      latitude: validated.latitude ?? null,
      longitude: validated.longitude ?? null,
      lat: validated.latitude ?? null,
      lng: validated.longitude ?? null,
      address: validated.address_line || null,
      address_line: validated.address_line || null,
      image_url: validated.image_url || null,
      image_urls: validated.image_urls && validated.image_urls.length > 0 ? validated.image_urls : null,
      phone: validated.phone || null,
      website: validated.website || null,
      tagline: validated.tagline || null,
      social_media: (validated.social_media && Object.keys(validated.social_media).length > 0) ? validated.social_media : null,
      operating_hours: (validated.operating_hours && Object.keys(validated.operating_hours).length > 0) ? validated.operating_hours : null,
      facilities: (validated.facilities && Object.keys(validated.facilities).length > 0) ? validated.facilities : null,
      star_rating: validated.star_rating,
      check_in_time: validated.check_in_time,
      check_out_time: validated.check_out_time,
      amenities: validated.amenities,
      cuisine_type: validated.cuisine_type,
      price_level: validated.price_level,
      accepts_reservations: validated.accepts_reservations
    }

    // Clean up attributes
    Object.keys(attributes).forEach(key => {
      if (attributes[key] === null || attributes[key] === undefined) {
        delete attributes[key]
      }
    })

    const businessData = {
      city_id: validated.city_id,
      name: validated.name,
      description: validated.description || null,
      category: validated.category,
      owner_user_id: user.id,
      type: businessType,
      attributes: attributes
    }

    logger.log('API: Inserting business data', { name: businessData.name, userId: user.id })

    const { data: business, error } = await insertClient
      .from('businesses')
      .insert(businessData)
      .select('id')
      .single()

    if (error) {
      logger.error('API: Error creating business', error, { userId: user.id })
      return NextResponse.json(
        failure(error.message, 'BUSINESS_CREATE_ERROR'),
        { status: 400 }
      )
    }

    if (!business) {
      return NextResponse.json(
        failure('Failed to create business', 'BUSINESS_CREATE_ERROR'),
        { status: 500 }
      )
    }

    revalidatePath('/business-portal/dashboard')
    revalidatePath('/explore')

    return NextResponse.json(
      success({ businessId: business.id }),
      {
        headers: {
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        },
      }
    )
  } catch (error: unknown) {
    logger.error('API: Error in create business', error)
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    )
  }
}

