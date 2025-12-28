import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
type SavedBusiness = Database['public']['Tables']['saved_businesses']['Row']

export interface UserProfileData {
  profile: Profile
  preferences: UserPreferences | null
  stats: {
    tripsCount: number
    reviewsCount: number
    savedPlacesCount: number
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
    console.log('getUserProfile: Fetching profile for user:', userId)
    
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
        console.log('getUserProfile: Profile not found, attempting to create...')
        
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
          })
          .select()
          .single()
        
        if (createError || !newProfile) {
          console.error('getUserProfile: Failed to create profile:', createError)
          throw new Error(`Profile not found and could not be created: ${createError?.message || 'Unknown error'}`)
        }
        
        console.log('getUserProfile: Profile created successfully')
        profile = newProfile
      } else {
        // Other error (like 406 - RLS issue)
        // For 406, it might be an RLS policy issue
        if (profileError.code === 'PGRST301' || profileError.message?.includes('406') || profileError.code === '42501') {
          console.error('getUserProfile: RLS policy issue detected. User ID:', userId, 'Auth UID:', authUser?.id)
          console.error('getUserProfile: This usually means RLS policies are blocking access')
          console.error('getUserProfile: Please ensure RLS policies allow users to view their own profile')
          throw new Error(`Access denied by RLS policies. Please check that you can view your own profile. (Code: ${profileError.code})`)
        }
        throw new Error(`Failed to fetch profile: ${profileError.message} (Code: ${profileError.code})`)
      }
    }

    if (!profile) {
      throw new Error('Profile data is null')
    }

    console.log('getUserProfile: Profile fetched successfully')

    // Fetch preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Don't throw if preferences don't exist yet (can be null)
    if (prefsError && prefsError.code !== 'PGRST116') {
      console.error('getUserProfile: Error fetching preferences:', prefsError)
    } else {
      console.log('getUserProfile: Preferences fetched:', preferences ? 'found' : 'not found')
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
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ])

    const tripsCount = tripsResult.status === 'fulfilled' ? (tripsResult.value.count || 0) : 0
    const reviewsCount = reviewsResult.status === 'fulfilled' ? (reviewsResult.value.count || 0) : 0
    const savedPlacesCount = savedResult.status === 'fulfilled' ? (savedResult.value.count || 0) : 0

    if (tripsResult.status === 'rejected') {
      console.error('getUserProfile: Error fetching trips:', tripsResult.reason)
    }
    if (reviewsResult.status === 'rejected') {
      console.error('getUserProfile: Error fetching reviews:', reviewsResult.reason)
    }
    if (savedResult.status === 'rejected') {
      console.error('getUserProfile: Error fetching saved businesses:', savedResult.reason)
    }

    console.log('getUserProfile: Stats fetched:', { tripsCount, reviewsCount, savedPlacesCount })

    return {
      profile,
      preferences: preferences || null,
      stats: {
        tripsCount,
        reviewsCount,
        savedPlacesCount,
      },
    }
  } catch (error) {
    console.error('getUserProfile: Error:', error)
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
    const { error } = await supabase
      .from('saved_businesses')
      .insert({
        user_id: userId,
        business_id: businessId,
      })

    if (error) {
      throw new Error(`Failed to save business: ${error.message}`)
    }
  } catch (error) {
    console.error('Error in saveBusinessForUser:', error)
    throw error
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

