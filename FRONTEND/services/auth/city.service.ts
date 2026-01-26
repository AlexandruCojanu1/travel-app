import { createClient } from "@/lib/supabase/client"
import { Database } from "@/types/database.types"

type City = Database['public']['Tables']['cities']['Row']

// Cache for cities to avoid repeated requests
let citiesCache: City[] | null = null
let citiesCacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getCityById(cityId: string): Promise<City | null> {
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

export async function getCities(): Promise<City[]> {
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

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return d
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}

export async function getNearestCity(latitude: number, longitude: number): Promise<City | null> {
  const cities = await getCities()
  if (!cities || cities.length === 0) return null

  let nearestCity: City | null = null
  let minDistance = Infinity
  const MAX_DISTANCE_KM = 50 // Threshold to consider "in" a city

  for (const city of cities) {
    // Ensure city has valid coordinates. Use latitude/longitude or appropriate columns.
    // Based on database types, cities usually have latitude/longitude.
    // If they are nullable, we must check.
    if (city.latitude == null || city.longitude == null) continue

    const distance = getDistanceFromLatLonInKm(latitude, longitude, city.latitude, city.longitude)
    if (distance < minDistance) {
      minDistance = distance
      nearestCity = city
    }
  }

  if (minDistance <= MAX_DISTANCE_KM) {
    return nearestCity
  }

  return null
}
