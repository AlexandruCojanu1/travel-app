import { createClient } from '@/lib/supabase/client'

export interface Business {
  id: string
  city_id: string
  name: string
  description: string | null
  category: string
  address: string | null
  latitude: number | null
  longitude: number | null
  image_url: string | null
  rating: number | null
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface MapBusiness {
  id: string
  name: string
  category: string
  latitude: number
  longitude: number
  rating: number | null
  image_url: string | null
  price_level: string
  address: string | null
}

/**
 * Fetch businesses for map display (only businesses with valid coordinates)
 */
export async function getBusinessesForMap(
  cityId: string,
  category?: string
): Promise<MapBusiness[]> {
  const supabase = createClient()

  try {
    let query = supabase
      .from('businesses')
      .select('*')
      .eq('city_id', cityId)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('rating', { ascending: false })

    if (error) {
      console.error('Error fetching businesses for map:', error)
      return []
    }

    // Transform to MapBusiness and add price_level based on category
    return (data || []).map((business) => ({
      id: business.id,
      name: business.name,
      category: business.category,
      latitude: business.latitude!,
      longitude: business.longitude!,
      rating: business.rating,
      image_url: business.image_url,
      address: business.address,
      price_level: getPriceLevelForCategory(business.category),
    }))
  } catch (error) {
    console.error('Unexpected error fetching businesses for map:', error)
    return []
  }
}

/**
 * Fetch a single business by ID
 */
export async function getBusinessById(id: string): Promise<Business | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching business by ID:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error fetching business by ID:', error)
    return null
  }
}

/**
 * Fetch businesses by category for a city
 */
export async function getBusinessesByCategory(
  cityId: string,
  category: string,
  limit: number = 10
): Promise<Business[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('city_id', cityId)
      .eq('category', category)
      .order('rating', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching businesses by category:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching businesses by category:', error)
    return []
  }
}

/**
 * Search businesses within a bounding box (for "Search this area" feature)
 */
export async function searchBusinessesInBounds(
  cityId: string,
  bounds: {
    north: number
    south: number
    east: number
    west: number
  },
  category?: string
): Promise<MapBusiness[]> {
  const supabase = createClient()

  try {
    let query = supabase
      .from('businesses')
      .select('*')
      .eq('city_id', cityId)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('latitude', bounds.south)
      .lte('latitude', bounds.north)
      .gte('longitude', bounds.west)
      .lte('longitude', bounds.east)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('rating', { ascending: false })

    if (error) {
      console.error('Error searching businesses in bounds:', error)
      return []
    }

    return (data || []).map((business) => ({
      id: business.id,
      name: business.name,
      category: business.category,
      latitude: business.latitude!,
      longitude: business.longitude!,
      rating: business.rating,
      image_url: business.image_url,
      address: business.address,
      price_level: getPriceLevelForCategory(business.category),
    }))
  } catch (error) {
    console.error('Unexpected error searching businesses in bounds:', error)
    return []
  }
}

/**
 * Advanced search function with filters and query
 */
export interface SearchFilters {
  priceRange: [number, number]
  categories: string[]
  amenities: string[]
  difficulty: string | null
}

export type SortOption = 'recommended' | 'price_asc' | 'rating_desc' | 'name_asc'

export async function searchBusinesses(
  cityId: string,
  filters: SearchFilters,
  query: string = '',
  sortBy: SortOption = 'recommended'
): Promise<Business[]> {
  const supabase = createClient()

  try {
    let supabaseQuery = supabase
      .from('businesses')
      .select('*')
      .eq('city_id', cityId)

    // Text search (name and description)
    if (query.trim()) {
      supabaseQuery = supabaseQuery.or(
        `name.ilike.%${query}%,description.ilike.%${query}%`
      )
    }

    // Category filter
    if (filters.categories.length > 0) {
      supabaseQuery = supabaseQuery.in('category', filters.categories)
    }

    // Price range filter (using attributes JSONB column if available)
    // Note: This assumes businesses have an attributes JSONB column with price info
    // If not, we'll filter based on category-based price levels
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
      // For now, we'll use a workaround: filter by category price levels
      // In production, you'd query attributes->>'price' or a dedicated price column
      const priceCategories: string[] = []
      if (filters.priceRange[1] < 100) {
        priceCategories.push('Nature') // Free
      }
      if (filters.priceRange[0] < 200 && filters.priceRange[1] > 50) {
        priceCategories.push('Activities') // €
      }
      if (filters.priceRange[0] < 500 && filters.priceRange[1] > 100) {
        priceCategories.push('Food') // €€
      }
      if (filters.priceRange[0] > 200) {
        priceCategories.push('Hotels') // €€€
      }

      if (priceCategories.length > 0 && filters.categories.length === 0) {
        supabaseQuery = supabaseQuery.in('category', priceCategories)
      }
    }

    // Difficulty filter (for nature spots) - using attributes JSONB
    if (filters.difficulty) {
      supabaseQuery = supabaseQuery.eq('category', 'Nature')
      // Filter by attributes->>'difficulty' if attributes column exists
      // This is a simplified version - in production, use proper JSONB query
      // supabaseQuery = supabaseQuery.contains('attributes', { difficulty: filters.difficulty })
    }

    // Amenities filter (for hotels) - using attributes JSONB
    if (filters.amenities.length > 0) {
      supabaseQuery = supabaseQuery.eq('category', 'Hotels')
      // Filter by attributes->>'amenities' if attributes column exists
      // This would require checking if amenities array contains the selected values
    }

    // Sorting
    switch (sortBy) {
      case 'rating_desc':
        supabaseQuery = supabaseQuery.order('rating', { ascending: false, nullsFirst: false })
        break
      case 'name_asc':
        supabaseQuery = supabaseQuery.order('name', { ascending: true })
        break
      case 'price_asc':
        // Sort by category (proxy for price) - in production, use actual price column
        supabaseQuery = supabaseQuery.order('category', { ascending: true })
        break
      case 'recommended':
      default:
        // Recommended: verified first, then by rating
        supabaseQuery = supabaseQuery.order('is_verified', { ascending: false })
        supabaseQuery = supabaseQuery.order('rating', { ascending: false, nullsFirst: false })
        break
    }

    const { data, error } = await supabaseQuery

    if (error) {
      console.error('Error searching businesses:', error)
      return []
    }

    // Client-side filtering for attributes (if needed)
    let results = data || []

    // Filter by difficulty if set (client-side fallback)
    if (filters.difficulty) {
      results = results.filter((business) => {
        // Check if business has attributes with difficulty
        const attributes = (business as any).attributes
        if (attributes && typeof attributes === 'object') {
          return attributes.difficulty === filters.difficulty
        }
        return true // If no attributes, include it
      })
    }

    // Filter by amenities if set (client-side fallback)
    if (filters.amenities.length > 0) {
      results = results.filter((business) => {
        const attributes = (business as any).attributes
        if (attributes && attributes.amenities && Array.isArray(attributes.amenities)) {
          return filters.amenities.every((amenity) =>
            attributes.amenities.includes(amenity)
          )
        }
        return false // If no amenities, exclude it
      })
    }

    return results
  } catch (error) {
    console.error('Unexpected error searching businesses:', error)
    return []
  }
}

/**
 * Helper function to determine price level based on category
 */
function getPriceLevelForCategory(category: string): string {
  const priceLevels: Record<string, string> = {
    Hotels: '€€€',
    Food: '€€',
    Activities: '€',
    Nature: 'Free',
  }

  return priceLevels[category] || '€€'
}

