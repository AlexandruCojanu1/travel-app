import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import type { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

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
export async function getHomeContext(userId: string, supabaseClient?: SupabaseClient<Database>): Promise<HomeContext> {
  const supabase = supabaseClient || createClient()

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
        role: (profile.role as "tourist" | "local") || null,
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
        role: (profile.role as "tourist" | "local") || null,
      }
    }

    return {
      userId,
      homeCity: city,
      homeCityId: profile.home_city_id,
      role: (profile.role as "tourist" | "local") || null,
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
  categoryFilter?: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<CityFeedData> {
  const supabase = supabaseClient || createClient()

  try {
    // Execute fetches in parallel for better performance
    const [postsResult, businessesResult, promotionsResult] = await Promise.all([
      // 1. Fetch city posts
      supabase
        .from('city_posts')
        .select('*')
        .eq('city_id', cityId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(res => {
          if (res.error) logger.error('Error fetching city posts', res.error, { cityId })
          return res.data || []
        }),

      // 2. Fetch featured businesses logic wrapped in a promise
      (async () => {
        let businessQuery = supabase
          .from('businesses')
          .select('*')
          .eq('city_id', cityId)
          .limit(20)

        // Try to order by rating
        try {
          businessQuery = businessQuery.order('rating', { ascending: false, nullsFirst: false })
        } catch (e) {
          businessQuery = businessQuery.order('created_at', { ascending: false })
        }

        // Apply filters
        if (categoryFilter && categoryFilter !== 'All') {
          const categoryMap: Record<string, string> = {
            'Food': 'Restaurant',
            'Hotels': 'Hotels',
            'Nature': 'Nature',
            'Activities': 'Activities',
          }
          const dbCategory = categoryMap[categoryFilter] || categoryFilter
          businessQuery = businessQuery.eq('category', dbCategory)
        } else {
          // Default filter: exclude lodging (simplified for reliability)
          businessQuery = businessQuery
            .neq('category', 'Hotel')
            .neq('category', 'Hotels')
            .neq('category', 'Accommodation')
            .neq('category', 'Guesthouse')
            .neq('category', 'Apartment')
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

            if (categoryFilter && categoryFilter !== 'All') {
              const categoryMap: Record<string, string> = {
                'Food': 'Restaurant',
                'Hotels': 'Hotels',
                'Nature': 'Nature',
                'Activities': 'Activities',
              }
              const dbCategory = categoryMap[categoryFilter] || categoryFilter
              fallbackQuery.eq('category', dbCategory)
            }

            const { data: fallbackBusinesses } = await fallbackQuery
            return fallbackBusinesses || []
          }
          return []
        }

        return featuredBusinesses || []
      })(),

      // 3. Fetch active promotions
      supabase
        .from('promotions')
        .select('*')
        .limit(5)
        .then(res => {
          if (res.error) logger.warn('Error fetching promotions (non-critical)', { error: res.error, cityId })
          return res.data || []
        })
    ])

    // Process businesses (image fallback) - this happens in memory, fast
    const processedBusinesses = businessesResult.map(b => {
      const attrs = b.attributes as any
      if ((!b.image_url || b.image_url.trim() === '') && attrs?.image_url) {
        return { ...b, image_url: attrs.image_url }
      }
      return b
    })

    return {
      cityPosts: postsResult,
      featuredBusinesses: processedBusinesses,
      promotions: promotionsResult,
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
