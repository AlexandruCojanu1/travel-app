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
      .maybeSingle()

    let tripId: string
    let tripResult

    const commonData = {
      destination_city_id: tripData.city_id || tripData.destination_city_id,
      start_date: tripData.start_date,
      end_date: tripData.end_date,
      title: tripData.title,
      budget_total: tripData.budget_total,
      status: 'planning', // Ensure we use a valid string
      updated_at: new Date().toISOString(),
    }

    if (existingTrip) {
      // Update existing trip
      const { data, error } = await supabase
        .from("trips")
        .update(commonData)
        .eq("id", existingTrip.id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }
      tripId = data.id
      tripResult = data
    } else {
      // Create new trip
      const { data, error } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          ...commonData,
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }
      tripId = data.id
      tripResult = data
    }

    // Now sync items if provided
    if (items && items.length > 0) {
      // 1. Delete existing items for this trip to ensure clean sync
      // (This is a simplified approach for a single-trip-per-user system)
      await supabase
        .from("trip_items")
        .delete()
        .eq("trip_id", tripId)

      // 2. Insert new items
      const itemsToInsert = items.map(item => ({
        trip_id: tripId,
        business_id: item.business_id,
        business_name: item.business_name,
        business_category: item.business_category,
        estimated_cost: item.estimated_cost || 0,
        day_index: item.day_index,
      }))

      const { error: itemsError } = await supabase
        .from("trip_items")
        .insert(itemsToInsert)

      if (itemsError) {
        console.error("Error saving trip items:", itemsError)
        // We don't fail the whole trip save if items fail, but we log it
      }
    } else if (items) {
      // Items were provided but empty - clear them from DB
      await supabase
        .from("trip_items")
        .delete()
        .eq("trip_id", tripId)
    }

    return { success: true, tripId, trip: tripResult }
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
    // Fetch trip with its items
    const { data, error } = await supabase
      .from("trips")
      .select(`
        *,
        items:trip_items(*)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      if (error.code === "PGRST116" || (error as any).status === 406) {
        return { success: true, trip: null }
      }
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, trip: null }
    }

    return { success: true, trip: data[0] }
  } catch (error: unknown) {
    // Silently handle errors - trips are optional
    return { success: true, trip: null }
  }
}

