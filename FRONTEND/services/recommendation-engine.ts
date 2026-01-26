import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"

export type RankedLocation = {
  business: Database["public"]["Tables"]["businesses"]["Row"]
  score: number
  priceScore: number
  distanceScore: number
  affinityScore: number
  ratingScore: number
  distanceKm: number
  estimatedPrice: number
}

type AlgorithmSettings = {
  split_ratio_hotel: number
  split_ratio_food: number
  split_ratio_activity: number
  weight_price_fit: number
  weight_distance: number
  weight_affinity: number
  weight_rating: number
  penalty_per_km: number
}

type UserParams = {
  totalBudget: number
  groupSize: number
  days: number
  dates: { start: string; end: string }
  preferences: string[]
  anchorCoords: { lat: number; lng: number }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate percentage match between user preferences and business tags
 */
function calculateAffinity(
  userPreferences: string[],
  businessTags: string[] | null
): number {
  if (!businessTags || businessTags.length === 0) return 0
  if (userPreferences.length === 0) return 50 // Neutral score if no preferences

  const matches = businessTags.filter((tag) =>
    userPreferences.some(
      (pref) => tag.toLowerCase().includes(pref.toLowerCase()) ||
      pref.toLowerCase().includes(tag.toLowerCase())
    )
  ).length

  return (matches / Math.max(userPreferences.length, businessTags.length)) * 100
}

/**
 * Get algorithm settings from database
 */
async function getAlgorithmSettings(
  supabase: SupabaseClient<Database>
): Promise<AlgorithmSettings> {
  const { data, error } = await supabase
    .from("algorithm_settings")
    .select("*")
    .eq("id", 1)
    .single()

  if (error || !data) {
    // Return defaults if not found
    return {
      split_ratio_hotel: 0.4,
      split_ratio_food: 0.3,
      split_ratio_activity: 0.3,
      weight_price_fit: 0.3,
      weight_distance: 0.2,
      weight_affinity: 0.3,
      weight_rating: 0.2,
      penalty_per_km: 10.0,
    }
  }

  return {
    split_ratio_hotel: Number(data.split_ratio_hotel),
    split_ratio_food: Number(data.split_ratio_food),
    split_ratio_activity: Number(data.split_ratio_activity),
    weight_price_fit: Number(data.weight_price_fit),
    weight_distance: Number(data.weight_distance),
    weight_affinity: Number(data.weight_affinity),
    weight_rating: Number(data.weight_rating),
    penalty_per_km: Number(data.penalty_per_km),
  }
}

/**
 * Get estimated price for a business based on category and group size
 */
function getEstimatedPrice(
  business: Database["public"]["Tables"]["businesses"]["Row"],
  category: "hotel" | "restaurant" | "activity",
  groupSize: number,
  days: number
): number {
  // Try to get price from business_resources first
  // For now, use price_level as fallback
  const priceLevel = business.price_level || 2

  if (category === "hotel") {
    // Estimate: price_level * 50 * nights * rooms (assuming 2 per room)
    const rooms = Math.ceil(groupSize / 2)
    return priceLevel * 50 * days * rooms
  } else if (category === "restaurant") {
    // Estimate: price_level * 30 * groupSize
    return priceLevel * 30 * groupSize
  } else {
    // Activity: price_level * 20 * groupSize
    return priceLevel * 20 * groupSize
  }
}

/**
 * Main recommendation engine function
 */
export async function getRankedLocations(
  supabase: SupabaseClient<Database>,
  userParams: UserParams,
  category: "hotel" | "restaurant" | "activity",
  currentSpend: number = 0
): Promise<RankedLocation[]> {
  // 1. Fetch algorithm settings
  const config = await getAlgorithmSettings(supabase)

  // 2. Calculate available budget bucket
  let bucket: number
  if (category === "hotel") {
    bucket = userParams.totalBudget * config.split_ratio_hotel
  } else {
    const remainingBudget = userParams.totalBudget - currentSpend
    const categoryRatio =
      category === "restaurant"
        ? config.split_ratio_food
        : config.split_ratio_activity
    const nonHotelRatio = 1 - config.split_ratio_hotel
    bucket = remainingBudget * (categoryRatio / nonHotelRatio)
  }

  // 3. Determine business type filter
  const businessTypeMap: Record<
    "hotel" | "restaurant" | "activity",
    Database["public"]["Enums"]["business_type"]
  > = {
    hotel: "hotel",
    restaurant: "restaurant",
    activity: "activity",
  }

  // 4. Fetch candidates from database
  let query = supabase
    .from("businesses")
    .select("*")
    .eq("type", businessTypeMap[category])
    .not("latitude", "is", null)
    .not("longitude", "is", null)

  // Hard filter: capacity check (if available in business_resources)
  // For now, we'll filter by price_level as a proxy for capacity
  // In production, you'd join with business_resources

  const { data: businesses, error } = await query

  if (error || !businesses) {
    console.error("Error fetching businesses:", error)
    return []
  }

  // 5. Score each candidate
  const scored: RankedLocation[] = businesses
    .map((business) => {
      if (!business.latitude || !business.longitude) return null

      const estimatedPrice = getEstimatedPrice(
        business,
        category,
        userParams.groupSize,
        userParams.days
      )

      // Price Score
      let priceScore: number
      if (estimatedPrice <= bucket) {
        priceScore = 100
      } else {
        const overage = estimatedPrice - bucket
        const penalty = (overage / bucket) * 100 * config.weight_price_fit
        priceScore = Math.max(0, 100 - penalty)
      }

      // Distance Score
      const distanceKm = calculateDistance(
        userParams.anchorCoords.lat,
        userParams.anchorCoords.lng,
        business.latitude,
        business.longitude
      )
      const distanceScore = Math.max(
        0,
        100 - distanceKm * config.penalty_per_km * config.weight_distance
      )

      // Affinity Score
      const affinityMatch = calculateAffinity(
        userParams.preferences,
        business.tags
      )
      const affinityScore = affinityMatch * config.weight_affinity

      // Rating Score
      const rating = business.rating || 0
      const ratingScore = (rating / 5) * 100 * config.weight_rating

      // Final Score (weighted average)
      const finalScore =
        priceScore * config.weight_price_fit +
        distanceScore * config.weight_distance +
        affinityScore * config.weight_affinity +
        ratingScore * config.weight_rating

      return {
        business,
        score: finalScore,
        priceScore,
        distanceScore,
        affinityScore,
        ratingScore,
        distanceKm,
        estimatedPrice,
      }
    })
    .filter((item): item is RankedLocation => item !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20) // Top 20

  return scored
}

/**
 * Get algorithm settings (public helper)
 */
export async function getAlgorithmConfig(
  supabase: SupabaseClient<Database>
): Promise<AlgorithmSettings> {
  return getAlgorithmSettings(supabase)
}
