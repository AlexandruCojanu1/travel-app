import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

type Trip = Database["public"]["Tables"]["trips"]["Row"]

export interface TripData {
  city_id?: string
  destination_city_id?: string
  start_date: string
  end_date: string
  title?: string | null
  budget_total?: number | null
  items?: any[]
  status?: string
}

export async function createOrUpdateTrip(
  tripData: TripData, 
  items?: Array<{
    id?: string
    business_id: string
    business_name?: string
    business_category?: string
    estimated_cost?: number
    day_index: number
    [key: string]: unknown
  }>
) {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // Check if trip exists
    const { data: existingTrip } = await supabase
      .from("trips")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (existingTrip) {
      // Update existing trip
      const { data, error } = await supabase
        .from("trips")
        .update({
          city_id: tripData.city_id || tripData.destination_city_id,
          start_date: tripData.start_date,
          end_date: tripData.end_date,
          title: tripData.title,
          budget_total: tripData.budget_total,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingTrip.id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, tripId: data.id, trip: data }
    } else {
      // Create new trip
      const { data, error } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          city_id: tripData.city_id || tripData.destination_city_id,
          start_date: tripData.start_date,
          end_date: tripData.end_date,
          title: tripData.title,
          budget_total: tripData.budget_total,
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, tripId: data.id, trip: data }
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error')
    return { success: false, error: err.message || "An unexpected error occurred" }
  }
}

export async function fetchUserTrip() {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      // 406 error usually means Accept header issue or RLS policy
      // Try without .single() first
      if (error.code === "PGRST116" || error.status === 406) {
        // No trip found or RLS issue - return empty
        return { success: true, trip: null }
      }
      return { success: false, error: error.message }
    }

    // If no data, return null
    if (!data || data.length === 0) {
      return { success: true, trip: null }
    }

    return { success: true, trip: data[0] }
  } catch (error: unknown) {
    // Silently handle errors - trips are optional
    return { success: true, trip: null }
  }
}

