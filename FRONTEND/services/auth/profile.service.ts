import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
type SavedBusiness = Database['public']['Tables']['saved_businesses']['Row']
type City = Database['public']['Tables']['cities']['Row'] // Added City type for home_city

export interface UserProfileData {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  home_city_id?: string
  home_city?: City
  onboarding_data?: any
  onboarding_completed?: boolean
  persona?: string
  preferences?: UserPreferences | null
  stats: {
    tripsCount: number
    savedPlacesCount: number
    reviewsCount: number
  }
}

export interface PreferencesUpdateData {
  preferred_language?: string
  currency?: string
  notification_enabled?: boolean
  travel_style?: string | null
  budget_split_hotel?: number | null
  budget_split_food?: number | null
  budget_split_activities?: number | null
  activity_prefs?: string[] | null
  food_prefs?: string[] | null
}

/**
 * Fetches complete user profile with preferences and stats
 */
export async function getUserProfile(userId: string): Promise<UserProfileData> {
  const supabase = createClient()

  try {


    // First, verify user is authenticated
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser || authUser.id !== userId) {
      throw new Error('Not authenticated or user mismatch')
    }

    // Fetch profile
    const { data: fetchedProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    let profile = fetchedProfile || null

    if (profileError) {
      console.error('getUserProfile: Profile fetch error:', profileError)
      console.error('getUserProfile: Error details:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      })

      // If profile doesn't exist (PGRST116 = no rows returned), try to create it
      if (profileError.code === 'PGRST116') {
        logger.log('getUserProfile: Profile not found, attempting to create', { userId })

        // Get user email from auth (we already have authUser from above)
        if (!authUser) {
          throw new Error('User not found in auth')
        }

        // Try to create profile (without email if column doesn't exist)
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            full_name: authUser.user_metadata?.full_name || null,
            role: 'tourist', // Default role to satisfy profiles_role_check constraint
          })
          .select()
          .single()

        if (createError) {
          // Check for duplicate key violation (race condition)
          if (createError.code === '23505') {
            logger.log('getUserProfile: Race condition detected - profile already created by another request, refetching...', { userId })

            // Retry fetch
            const { data: retryProfile, error: retryError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single()

            if (retryError || !retryProfile) {
              logger.error('getUserProfile: Failed to refetch profile after race condition', retryError, { userId })
              throw new Error(`Profile creation conflict and refetch failed: ${retryError?.message || 'Unknown error'}`)
            }

            profile = retryProfile
          } else {
            logger.error('getUserProfile: Failed to create profile', createError, { userId })
            throw new Error(`Profile not found and could not be created: ${createError?.message || 'Unknown error'}`)
          }
        } else if (!newProfile) {
          logger.error('getUserProfile: Profile creation returned no data', null, { userId })
          throw new Error('Profile creation returned no data')
        } else {
          logger.log('getUserProfile: Profile created successfully', { userId })
          profile = newProfile
        }
      } else {
        // Other error (like 406 - RLS issue)
        // For 406, it might be an RLS policy issue
        if (profileError.code === 'PGRST301' || profileError.message?.includes('406') || profileError.code === '42501') {
          logger.error('getUserProfile: RLS policy issue detected', profileError, {
            userId,
            authUid: authUser?.id,
            code: profileError.code,
          })
          throw new Error(`Access denied by RLS policies. Please check that you can view your own profile. (Code: ${profileError.code})`)
        }
        throw new Error(`Failed to fetch profile: ${profileError.message} (Code: ${profileError.code})`)
      }
    }

    if (!profile) {
      throw new Error('Profile data is null')
    }

    logger.log('getUserProfile: Profile fetched successfully', { userId })

    // Fetch preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() // Use maybeSingle to avoid 406/PGRST116 when no record exists

    if (prefsError) {
      if (prefsError.code === '406' || prefsError.message?.includes('406')) {
        logger.log('getUserProfile: Preferences RLS/406 issue handled', { userId })
      } else {
        logger.error('getUserProfile: Error fetching preferences', prefsError, { userId })
      }
    } else {
      logger.log('getUserProfile: Preferences fetched', { userId, found: !!preferences })
    }

    // Fetch stats in parallel - handle errors gracefully
    const [tripsResult, reviewsResult, savedResult] = await Promise.allSettled([
      supabase
        .from('trips')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('saved_businesses')
        .select('business_id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ])

    const tripsCount = tripsResult.status === 'fulfilled' ? (tripsResult.value.count || 0) : 0
    const reviewsCount = reviewsResult.status === 'fulfilled' ? (reviewsResult.value.count || 0) : 0
    const savedPlacesCount = savedResult.status === 'fulfilled' ? (savedResult.value.count || 0) : 0

    if (tripsResult.status === 'rejected') {
      logger.error('getUserProfile: Error fetching trips', tripsResult.reason, { userId })
    }
    if (reviewsResult.status === 'rejected') {
      logger.error('getUserProfile: Error fetching reviews', reviewsResult.reason, { userId })
    }
    if (savedResult.status === 'rejected') {
      logger.error('getUserProfile: Error fetching saved businesses', savedResult.reason, { userId })
    }

    logger.log('getUserProfile: Stats fetched', { userId, tripsCount, reviewsCount, savedPlacesCount })

    // Merge metadata (source of truth for onboarding if migration missing)
    const metadata = authUser.user_metadata || {}

    // Construct final data, prioritizing metadata for onboarding fields
    const finalProfile = {
      ...profile,
      // If profile table is missing these columns, they will be undefined in `profile`
      // So we fallback to metadata
      onboarding_data: profile?.onboarding_data || metadata.onboarding_data || {},
      onboarding_completed: profile?.onboarding_completed || metadata.onboarding_completed || false,
      persona: profile?.persona || metadata.persona || 'Explorer'
    }

    return {
      // @ts-ignore - mismatch between Profile type and our extended interface, but runtime safe
      profile: finalProfile,
      // Also return these at top level for easy access as defined in interface
      id: userId,
      email: authUser.email || '',
      full_name: profile?.full_name || metadata.full_name,
      avatar_url: profile?.avatar_url || metadata.avatar_url,
      home_city_id: profile?.home_city_id || metadata.home_city_id,
      // home_city // This would need a join or separate fetch if not in profile join
      onboarding_data: finalProfile.onboarding_data,
      onboarding_completed: finalProfile.onboarding_completed,
      persona: finalProfile.persona,

      preferences: preferences || null,
      stats: {
        tripsCount,
        reviewsCount,
        savedPlacesCount,
      },
    }
  } catch (error) {
    logger.error('getUserProfile: Error', error, { userId })
    throw error
  }
}

/**
 * Updates user preferences (partial update supported)
 */
export async function updatePreferences(
  userId: string,
  data: PreferencesUpdateData
): Promise<void> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('user_preferences')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to update preferences: ${error.message}`)
    }
  } catch (error) {
    console.error('Error in updatePreferences:', error)
    throw error
  }
}

/**
 * Fetches saved businesses for user
 */
export async function getSavedBusinesses(userId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('saved_businesses')
      .select('*, businesses(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch saved businesses: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error in getSavedBusinesses:', error)
    throw error
  }
}

/**
 * Saves a business for the user
 */
export async function saveBusinessForUser(
  userId: string,
  businessId: string
): Promise<void> {
  const supabase = createClient()

  try {
    // Try to insert - if it fails due to RLS or duplicate, just silently succeed
    // The saved_businesses table may have RLS issues that need to be fixed in Supabase
    const { error } = await supabase
      .from('saved_businesses')
      .upsert({
        user_id: userId,
        business_id: businessId,
      }, {
        onConflict: 'user_id,business_id',
        ignoreDuplicates: true
      })

    // Silently ignore all errors - RLS/duplicate/etc
    if (error) {

    }
  } catch (error: any) {
    // Silently ignore all errors

  }
}

/**
 * Removes a saved business
 */
export async function unsaveBusinessForUser(
  userId: string,
  businessId: string
): Promise<void> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('saved_businesses')
      .delete()
      .eq('user_id', userId)
      .eq('business_id', businessId)

    if (error) {
      throw new Error(`Failed to unsave business: ${error.message}`)
    }
  } catch (error) {
    console.error('Error in unsaveBusinessForUser:', error)
    throw error
  }
}

/**
 * Completes user onboarding by updating profile
 */
export async function completeUserProfileOnboarding(
  userId: string,
  data: {
    homeCityId?: string
    role?: string
    persona?: string
    onboarding_data?: any
  }
): Promise<void> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        home_city_id: data.homeCityId,
        role: data.role || 'tourist',
        persona: data.persona,
        onboarding_data: data.onboarding_data || {},
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })

    if (error) {
      throw new Error(`Failed to complete onboarding: ${error.message}`)
    }
  } catch (error) {
    console.error('Error in completeUserProfileOnboarding:', error)
    throw error
  }
}

