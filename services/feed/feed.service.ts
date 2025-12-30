import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type CityPost = Database['public']['Tables']['city_posts']['Row']
type Business = Database['public']['Tables']['businesses']['Row']
type Promotion = Database['public']['Tables']['promotions']['Row']
type City = Database['public']['Tables']['cities']['Row']

export interface HomeContext {
  userId: string
  homeCity: City | null
  homeCityId: string | null
  role: 'tourist' | 'local' | null
}

export interface CityFeedData {
  cityPosts: CityPost[]
  featuredBusinesses: Business[]
  promotions: Promotion[]
}

export interface FeedError {
  message: string
  code?: string
}

/**
 * Fetches the user's home city context
 */
export async function getHomeContext(userId: string): Promise<HomeContext> {
  const supabase = createClient()

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('home_city_id, role')
      .eq('id', userId)
      .maybeSingle()

    // If profile doesn't exist or error, return default
    if (profileError || !profile) {
      console.warn('Profile not found or error:', profileError?.message)
      return {
        userId,
        homeCity: null,
        homeCityId: null,
        role: null,
      }
    }

    if (!profile.home_city_id) {
      return {
        userId,
        homeCity: null,
        homeCityId: null,
        role: profile.role || null,
      }
    }

    // Fetch city details
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', profile.home_city_id)
      .single()

    if (cityError) {
      console.error('Failed to fetch city details:', cityError)
      return {
        userId,
        homeCity: null,
        homeCityId: profile.home_city_id,
        role: profile.role || null,
      }
    }

    return {
      userId,
      homeCity: city,
      homeCityId: profile.home_city_id,
      role: profile.role || null,
    }
  } catch (error) {
    console.error('Error in getHomeContext:', error)
    throw error
  }
}

/**
 * Fetches the city feed data (posts, businesses, promotions)
 */
export async function getCityFeed(
  cityId: string,
  categoryFilter?: string
): Promise<CityFeedData> {
  const supabase = createClient()

  try {
    // Fetch city posts (news/events)
    let postsQuery = supabase
      .from('city_posts')
      .select('*')
      .eq('city_id', cityId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(10)

    if (categoryFilter && categoryFilter !== 'All') {
      postsQuery = postsQuery.eq('category', categoryFilter)
    }

    const { data: cityPosts, error: postsError } = await postsQuery

    if (postsError) {
      console.error('Error fetching city posts:', postsError)
    }

    // Fetch featured businesses (top rated or verified)
    let businessQuery = supabase
      .from('businesses')
      .select('*')
      .eq('city_id', cityId)
      .limit(5)

    // Try to order by rating, but handle gracefully if column doesn't exist
    // We'll order by created_at as fallback
    try {
      businessQuery = businessQuery.order('rating', { ascending: false, nullsFirst: false })
    } catch (e) {
      // Rating column doesn't exist, order by created_at instead
      businessQuery = businessQuery.order('created_at', { ascending: false })
    }

    if (categoryFilter && categoryFilter !== 'All') {
      businessQuery = businessQuery.eq('category', categoryFilter)
    }

    const { data: featuredBusinesses, error: businessError } = await businessQuery

    if (businessError) {
      console.error('Error fetching businesses:', businessError)
      // If error is about rating column, try again without rating order
      if (businessError.message?.includes('rating') || businessError.code === '42703') {
        console.warn('Rating column not found, fetching businesses without rating order')
        const fallbackQuery = supabase
          .from('businesses')
          .select('*')
          .eq('city_id', cityId)
          .order('created_at', { ascending: false })
          .limit(5)
        
        if (categoryFilter && categoryFilter !== 'All') {
          fallbackQuery.eq('category', categoryFilter)
        }
        
        const { data: fallbackBusinesses } = await fallbackQuery
        return {
          cityPosts: cityPosts || [],
          featuredBusinesses: fallbackBusinesses || [],
          promotions: [],
        }
      }
    }

    // Fetch active promotions
    // Handle case where is_active column might not exist
    // Don't try to filter by is_active or dates - just fetch all promotions
    // This avoids 400 errors if columns don't exist
    const { data: promotions, error: promotionsError } = await supabase
      .from('promotions')
      .select('*')
      .limit(5)

    if (promotionsError) {
      // Silently fail - promotions are optional
      console.warn('Error fetching promotions (non-critical):', promotionsError.message)
    }

    return {
      cityPosts: cityPosts || [],
      featuredBusinesses: featuredBusinesses || [],
      promotions: promotions || [],
    }
  } catch (error) {
    console.error('Error in getCityFeed:', error)
    throw error
  }
}

/**
 * Fetches a single business by ID
 */
export async function getBusinessById(businessId: string): Promise<Business | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()

    if (error) {
      console.error('Error fetching business:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getBusinessById:', error)
    return null
  }
}
