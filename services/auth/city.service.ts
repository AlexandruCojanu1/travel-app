import { createClient } from "@/lib/supabase/client"

// Cache for cities to avoid repeated requests
let citiesCache: Array<{
  id: string
  name: string
  country: string
  state_province: string | null
  latitude: number
  longitude: number
  is_active: boolean
  created_at: string
}> | null = null
let citiesCacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getCityById(cityId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("id", cityId)
    .single()

  if (error) {
    console.error("Error fetching city:", error)
    return null
  }

  return data
}

export async function getCities() {
  // Check cache first
  const now = Date.now()
  if (citiesCache && (now - citiesCacheTimestamp) < CACHE_DURATION) {
    return citiesCache
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("Error fetching cities:", error)
      // Return cached data if available, even if stale
      if (citiesCache) {
        return citiesCache
      }
      return []
    }

    // Update cache
    citiesCache = data || []
    citiesCacheTimestamp = now

    return citiesCache
  } catch (err) {
    console.error("Unexpected error fetching cities:", err)
    // Return cached data if available
    if (citiesCache) {
      return citiesCache
    }
    return []
  }
}

export async function getActiveCities() {
  return getCities()
}
