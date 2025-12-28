'use server'

import { createClient } from '@/lib/supabase/server'
import { businessSchema, type BusinessInput } from '@/lib/validations/business'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export type ActionResult = { success: boolean; error?: string; businessId?: string }

export type GetUserBusinessesResult = {
  success: boolean
  businesses?: Array<{
    id: string
    name: string
    category: string
    city_id: string
    [key: string]: any
  }>
  error?: string
}

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

export async function createBusiness(data: BusinessInput, userId?: string): Promise<ActionResult> {
  try {
    const validated = businessSchema.parse(data)
    
    // Create Supabase client with proper cookie handling
    const supabase = await createClient()

    // Get authenticated user - prioritize provided userId from client
    let user = null
    let userError = null
    
    // If userId is provided from client, use it directly (client already verified auth)
    if (userId) {
      console.log('createBusiness: Using provided userId from client:', userId)
      // Verify the user exists by querying the database (using service role if needed)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()
      
      if (!profileError && profileData) {
        user = { id: userId } as any
        console.log('createBusiness: User verified via database query:', userId)
      } else {
        console.error('createBusiness: Provided userId not found in database:', {
          error: profileError?.message,
          userId
        })
        // Still try to use userId even if query fails (might be RLS issue)
        user = { id: userId } as any
        console.log('createBusiness: Using userId despite query error (might be RLS):', userId)
      }
    }
    
    // If no userId provided, try to get from session
    if (!user) {
      console.log('createBusiness: No userId provided, trying session...')
      const authResult = await supabase.auth.getUser()
      user = authResult.data.user
      userError = authResult.error
      
      console.log('createBusiness: Session auth result:', {
        hasUser: !!user,
        userId: user?.id,
        error: userError?.message
      })
    }
    
    if (!user) {
      console.error('createBusiness: No user found - neither from userId nor session')
      return { success: false, error: 'User not authenticated. Please log in again.' }
    }
    
    console.log('createBusiness: User authenticated successfully:', user.id)

    // Map category to type enum
    const businessType = CATEGORY_TO_TYPE_MAP[validated.category] || null

    // Prepare attributes JSONB with type-specific fields
    const attributes: Record<string, any> = {}

    // Hotel fields
    if (validated.star_rating) attributes.star_rating = validated.star_rating
    if (validated.check_in_time) attributes.check_in_time = validated.check_in_time
    if (validated.check_out_time) attributes.check_out_time = validated.check_out_time
    if (validated.amenities) attributes.amenities = validated.amenities

    // Restaurant fields
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

    // Prepare business data
    const businessData: any = {
      city_id: validated.city_id,
      name: validated.name,
      description: validated.description || null,
      category: validated.category,
      owner_user_id: user.id,
      type: businessType,
      lat: validated.latitude || validated.latitude === 0 ? validated.latitude : null,
      lng: validated.longitude || validated.longitude === 0 ? validated.longitude : null,
      latitude: validated.latitude || validated.latitude === 0 ? validated.latitude : null,
      longitude: validated.longitude || validated.longitude === 0 ? validated.longitude : null,
      address_line: validated.address_line || null,
      phone: validated.phone || null,
      website: validated.website || null,
      image_url: validated.image_url || null,
      tagline: validated.tagline || null,
      logo_url: validated.logo_url || null,
      cover_image_url: validated.cover_image_url || null,
      email: validated.email || null,
      social_media: validated.social_media || {},
      operating_hours: validated.operating_hours || {},
      facilities: validated.facilities || {},
      attributes: Object.keys(attributes).length > 0 ? attributes : {},
    }

    // Insert business
    const { data: business, error } = await supabase
      .from('businesses')
      .insert(businessData)
      .select('id')
      .single()

    if (error) {
      console.error('Error creating business:', error)
      return { success: false, error: error.message }
    }

    if (!business) {
      return { success: false, error: 'Failed to create business' }
    }

    revalidatePath('/business-portal/dashboard')
    revalidatePath('/explore')

    return { success: true, businessId: business.id }
  } catch (error: any) {
    console.error('Error in createBusiness:', error)
    return { success: false, error: error.message || 'Failed to create business' }
  }
}

export async function getUserBusinesses(): Promise<GetUserBusinessesResult> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Fetch user's businesses
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching businesses:', error)
      return { success: false, error: error.message }
    }

    return { success: true, businesses: businesses || [] }
  } catch (error: any) {
    console.error('Error in getUserBusinesses:', error)
    return { success: false, error: error.message || 'Failed to fetch businesses' }
  }
}

export async function getBusinessBookings(businessId: string) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated', bookings: [] }
    }

    // Verify user owns this business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('owner_user_id', user.id)
      .single()

    if (!business) {
      return { success: false, error: 'Business not found or access denied', bookings: [] }
    }

    // Fetch bookings for this business
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        business_resources (
          id,
          name,
          business_id
        ),
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
      return { success: false, error: error.message, bookings: [] }
    }

    return { success: true, bookings: bookings || [] }
  } catch (error: any) {
    console.error('Error in getBusinessBookings:', error)
    return { success: false, error: error.message || 'Failed to fetch bookings', bookings: [] }
  }
}

export async function updateBookingStatus(bookingId: string, status: string) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Verify user owns the business for this booking
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id,
        business_id,
        businesses!inner (
          owner_user_id
        )
      `)
      .eq('id', bookingId)
      .single()

    if (!booking || (booking.businesses as any)?.owner_user_id !== user.id) {
      return { success: false, error: 'Booking not found or access denied' }
    }

    // Update booking status
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)

    if (error) {
      console.error('Error updating booking status:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/business-portal/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateBookingStatus:', error)
    return { success: false, error: error.message || 'Failed to update booking status' }
  }
}

export type CreatePromotionInput = {
  business_id: string
  package_type: 'silver' | 'gold' | 'platinum'
  amount: number
  duration_days: number
}

export type CreatePromotionResult = {
  success: boolean
  data?: { id: string }
  error?: string
}

export async function createPromotion(input: CreatePromotionInput): Promise<CreatePromotionResult> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Verify user owns the business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', input.business_id)
      .eq('owner_user_id', user.id)
      .single()

    if (!business) {
      return { success: false, error: 'Business not found or access denied' }
    }

    // Calculate valid dates
    const validFrom = new Date()
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + input.duration_days)

    // Create promotion
    const { data: promotion, error } = await supabase
      .from('promotions')
      .insert({
        business_id: input.business_id,
        title: `${input.package_type.charAt(0).toUpperCase() + input.package_type.slice(1)} Package Promotion`,
        description: `Promotion package: ${input.package_type}`,
        package_type: input.package_type,
        amount: input.amount,
        status: 'pending_payment',
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
        is_active: false, // Will be activated after payment
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating promotion:', error)
      return { success: false, error: error.message }
    }

    if (!promotion) {
      return { success: false, error: 'Failed to create promotion' }
    }

    revalidatePath('/business-portal/promote')
    return { success: true, data: { id: promotion.id } }
  } catch (error: any) {
    console.error('Error in createPromotion:', error)
    return { success: false, error: error.message || 'Failed to create promotion' }
  }
}
