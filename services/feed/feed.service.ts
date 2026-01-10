import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
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
      logger.warn('Profile not found or error', { error: profileError, userId })
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
      logger.error('Failed to fetch city details', cityError, { cityId: profile.home_city_id })
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
    logger.error('Error in getHomeContext', error, { userId })
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
    // Note: Don't filter by category as city_posts.category may not exist
    const { data: cityPosts, error: postsError } = await supabase
      .from('city_posts')
      .select('*')
      .eq('city_id', cityId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(10)

    if (postsError) {
      logger.error('Error fetching city posts', postsError, { cityId })
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

    // Map filter IDs to database category values
    if (categoryFilter && categoryFilter !== 'All') {
      const categoryMap: Record<string, string> = {
        'Food': 'Restaurant', // Map "Food" filter to "Restaurant" category in DB
        'Hotels': 'Hotels',
        'Nature': 'Nature',
        'Activities': 'Activities',
      }
      const dbCategory = categoryMap[categoryFilter] || categoryFilter
      businessQuery = businessQuery.eq('category', dbCategory)
    }

    const { data: featuredBusinesses, error: businessError } = await businessQuery

    if (businessError) {
      logger.error('Error fetching businesses', businessError, { cityId, categoryFilter })
      // If error is about rating column, try again without rating order
      if (businessError.message?.includes('rating') || businessError.code === '42703') {
        logger.warn('Rating column not found, fetching businesses without rating order', { cityId })
        const fallbackQuery = supabase
          .from('businesses')
          .select('*')
          .eq('city_id', cityId)
          .order('created_at', { ascending: false })
          .limit(5)

        // Map filter IDs to database category values
        if (categoryFilter && categoryFilter !== 'All') {
          const categoryMap: Record<string, string> = {
            'Food': 'Restaurant', // Map "Food" filter to "Restaurant" category in DB
            'Hotels': 'Hotels',
            'Nature': 'Nature',
            'Activities': 'Activities',
          }
          const dbCategory = categoryMap[categoryFilter] || categoryFilter
          fallbackQuery.eq('category', dbCategory)
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
      logger.warn('Error fetching promotions (non-critical)', { error: promotionsError, cityId })
    }

    return {
      cityPosts: cityPosts || [],
      featuredBusinesses: featuredBusinesses || [],
      promotions: promotions || [],
    }
  } catch (error) {
    logger.error('Error in getCityFeed', error, { cityId, categoryFilter })
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
      logger.error('Error fetching business', error, { businessId })
      return null
    }

    return data
  } catch (error) {
    logger.error('Error in getBusinessById', error, { businessId })
    return null
  }
}
