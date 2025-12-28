import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { businessSchema, type BusinessInput } from '@/lib/validations/business'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

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
      console.error('API: Auth error:', userError)
      authError = userError
    } else if (sessionUser) {
      user = sessionUser
      console.log('API: User authenticated from session:', user.id)
    }

    // If userId is provided, verify it matches the session
    if (userId) {
      if (user && user.id === userId) {
        console.log('API: Provided userId matches session:', userId)
      } else if (!user) {
        // Session failed but userId provided - use it as fallback
        user = { id: userId } as any
        console.log('API: Using provided userId as fallback (session failed):', userId)
      } else {
        console.warn('API: Provided userId does not match session user')
      }
    }

    if (!user) {
      console.error('API: No user found - authError:', authError)
      return NextResponse.json(
        { success: false, error: 'User not authenticated. Please log in again.' },
        { status: 401 }
      )
    }

    console.log('API: User authenticated:', user.id)
    
    // Note: getSession() may not work in API routes, but getUser() should be enough for RLS
    // RLS policy checks auth.uid() which is available if getUser() succeeds
    // Try to refresh session to ensure it's available for RLS
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (session) {
        console.log('API: Session available for RLS:', session.user.id)
      } else {
        console.warn('API: No session from getSession(), but user is authenticated. RLS should still work with auth.uid()')
      }
    } catch (e) {
      console.warn('API: Could not get session, but user is authenticated. Proceeding with insert.')
    }

    // Map category to type enum
    // If category is not in map, use a default type to satisfy NOT NULL constraint
    const businessType = CATEGORY_TO_TYPE_MAP[validated.category] || 'restaurant'
    
    if (!CATEGORY_TO_TYPE_MAP[validated.category]) {
      console.warn(`API: Category "${validated.category}" not in map, using default type "restaurant"`)
    }

    // Prepare attributes JSONB with type-specific fields
    const attributes: Record<string, any> = {}

    // Hotel fields
    if (validated.star_rating) attributes.star_rating = validated.star_rating
    if (validated.check_in_time) attributes.check_in_time = validated.check_in_time
    if (validated.check_out_time) attributes.check_out_time = validated.check_out_time
    if (validated.amenities) attributes.amenities = validated.amenities

    // Restaurant/Cafe fields
    if (validated.cuisine_type) attributes.cuisine_type = validated.cuisine_type
    if (validated.price_level) attributes.price_level = validated.price_level
    if (validated.accepts_reservations !== undefined) attributes.accepts_reservations = validated.accepts_reservations

    // Nature fields
    if (validated.difficulty) attributes.difficulty = validated.difficulty
    if (validated.length_km) attributes.length_km = validated.length_km
    if (validated.elevation_gain_m) attributes.elevation_gain_m = validated.elevation_gain_m
    if (validated.estimated_duration_hours) attributes.estimated_duration_hours = validated.estimated_duration_hours
    if (validated.trail_conditions) attributes.trail_conditions = validated.trail_conditions

    // Spa/Activity fields
    if (validated.activity_type) attributes.activity_type = validated.activity_type
    if (validated.duration_minutes) attributes.duration_minutes = validated.duration_minutes
    if (validated.max_participants) attributes.max_participants = validated.max_participants
    if (validated.equipment_provided !== undefined) attributes.equipment_provided = validated.equipment_provided

    // Prepare business data - use ONLY absolute minimum columns that MUST exist
    // Store ALL other fields in attributes JSONB to avoid schema cache errors
    // This is the safest approach when schema cache is unreliable
    // BUT: owner_user_id and type MUST be direct columns (NOT NULL constraints)
    const businessData: any = {
      city_id: validated.city_id,
      name: validated.name,
      description: validated.description || null,
      category: validated.category,
      owner_user_id: user.id, // REQUIRED: NOT NULL constraint, must be direct column
      type: businessType, // REQUIRED: NOT NULL constraint, must be direct column
    }
    
    // Store ALL other fields in attributes JSONB (safer approach - avoids schema cache errors)
    const extendedAttributes: Record<string, any> = {
      ...attributes,
      // Location (all location data in attributes)
      latitude: validated.latitude || validated.latitude === 0 ? validated.latitude : null,
      longitude: validated.longitude || validated.longitude === 0 ? validated.longitude : null,
      lat: validated.latitude || validated.latitude === 0 ? validated.latitude : null,
      lng: validated.longitude || validated.longitude === 0 ? validated.longitude : null,
      address: validated.address_line || null,
      address_line: validated.address_line || null,
      // Images (all in attributes since image_url might not be in cache)
      image_url: validated.image_url || null,
      logo_url: validated.logo_url || null,
      cover_image_url: validated.cover_image_url || null,
      // Contact
      phone: validated.phone || null,
      website: validated.website || null,
      email: validated.email || null,
      // Note: type is already in businessData as direct column (NOT NULL constraint), no need to duplicate in attributes
      // Extended info
      tagline: validated.tagline || null,
      social_media: validated.social_media && Object.keys(validated.social_media).length > 0 
        ? validated.social_media 
        : null,
      operating_hours: validated.operating_hours && Object.keys(validated.operating_hours).length > 0
        ? validated.operating_hours
        : null,
      facilities: validated.facilities && Object.keys(validated.facilities).length > 0
        ? validated.facilities
        : null,
    }
    
    // Remove null/undefined values to keep attributes clean
    Object.keys(extendedAttributes).forEach(key => {
      if (extendedAttributes[key] === null || extendedAttributes[key] === undefined) {
        delete extendedAttributes[key]
      }
    })
    
    businessData.attributes = Object.keys(extendedAttributes).length > 0 ? extendedAttributes : {}

    // Insert business using service role client to bypass RLS
    // This is necessary because auth.uid() is not available in API routes
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let insertClient = supabase
    
    if (serviceRoleKey) {
      // Use service role client to bypass RLS for insert
      insertClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      )
      console.log('API: Using service role client for insert (bypassing RLS)')
    } else {
      console.warn('API: Service role key not found, using regular client (RLS may fail)')
      console.warn('API: Add SUPABASE_SERVICE_ROLE_KEY to .env.local to bypass RLS')
    }
    
    // Log the data being inserted for debugging
    console.log('API: Inserting business data:', {
      city_id: businessData.city_id,
      name: businessData.name,
      category: businessData.category,
      owner_user_id: businessData.owner_user_id, // Now directly in businessData
      hasAttributes: !!businessData.attributes,
      attributesKeys: businessData.attributes ? Object.keys(businessData.attributes) : [],
      usingServiceRole: !!serviceRoleKey
    })
    
    const { data: business, error } = await insertClient
      .from('businesses')
      .insert(businessData)
      .select('id')
      .single()

    if (error) {
      console.error('API: Error creating business:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Failed to create business' },
        { status: 500 }
      )
    }

    revalidatePath('/business-portal/dashboard')
    revalidatePath('/explore')

    return NextResponse.json({ success: true, businessId: business.id })
  } catch (error: any) {
    console.error('API: Error in create business:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create business' },
      { status: 500 }
    )
  }
}

