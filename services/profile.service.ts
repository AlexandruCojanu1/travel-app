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
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`)
    }

    // Fetch preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Don't throw if preferences don't exist yet (can be null)
    if (prefsError && prefsError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', prefsError)
    }

    // Fetch stats in parallel
    const [tripsResult, reviewsResult, savedResult] = await Promise.all([
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

    return {
      profile,
      preferences: preferences || null,
      stats: {
        tripsCount: tripsResult.count || 0,
        reviewsCount: reviewsResult.count || 0,
        savedPlacesCount: savedResult.count || 0,
      },
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error)
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

