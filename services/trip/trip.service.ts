import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

export interface CreateTripDTO {
  title: string
  destination_city_id: string
  start_date: string
  end_date: string
  budget_total: number
  status: 'planning' | 'active' | 'completed'
  city_name?: string
  guests: number
}

export interface Trip {
  id: string
  user_id: string
  title: string
  destination_city_id: string
  start_date: string
  end_date: string
  budget_total: number
  currency: 'RON' | 'EUR' | 'USD'
  status: 'planning' | 'active' | 'completed'
  created_at: string
  updated_at: string
  items?: any[]
  guests: number
}

export async function createOrUpdateTrip(
  tripData: CreateTripDTO, // Changed from TripData to CreateTripDTO
  items?: Array<{
    id?: string
    business_id: string
    business_name?: string
    business_category?: string
    estimated_cost?: number
    day_index: number
    [key: string]: unknown
  }>,
  tripId?: string
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    let currentTripId = tripId
    let tripResult

    const commonData = {
      destination_city_id: tripData.destination_city_id,
      start_date: tripData.start_date,
      end_date: tripData.end_date,
      title: tripData.title,
      budget_total: tripData.budget_total,
      status: 'planning', // Ensure we use a valid string
      updated_at: new Date().toISOString(),
      guests: tripData.guests
    }

    if (currentTripId) {
      // Update existing trip
      const { data, error } = await supabase
        .from("trips")
        .update(commonData)
        .eq("id", currentTripId)
        .eq("user_id", user.id) // Security check
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }
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
      currentTripId = data.id
      tripResult = data
    }

    // Now sync items if provided
    if (items && items.length > 0) {
      // 1. Delete existing items for this trip to ensure clean sync
      await supabase
        .from("trip_items")
        .delete()
        .eq("trip_id", currentTripId)

      // 2. Insert new items
      const itemsToInsert = items.map(item => ({
        trip_id: currentTripId,
        business_id: item.business_id,
        // business_name removed as it is not in the schema (fetched via join)
        estimated_cost: item.estimated_cost || 0,
        day_index: item.day_index,
        block: (item as any).block || 'morning',
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
        .eq("trip_id", currentTripId)
    }

    return { success: true, tripId: currentTripId, trip: tripResult }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error')
    return { success: false, error: err.message || "An unexpected error occurred" }
  }
}

export async function deleteTrip(tripId: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("id", tripId)
      .eq("user_id", user.id) // Security check

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function fetchUserTrip(tripId?: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // Fetch trip with its items and related business details
    let query = supabase
      .from("trips")
      .select(`
        *,
        items:trip_items(
          *,
          business:businesses(
            name,
            category
          )
        )
      `)
      .eq("user_id", user.id)

    if (tripId) {
      query = query.eq("id", tripId)
    } else {
      query = query.order("created_at", { ascending: false }).limit(1)
    }

    const { data, error } = await query

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

/**
 * Add a single business to a trip's items
 */
export async function addBusinessToTrip(
  tripId: string,
  businessId: string,
  dayIndex: number = 0,
  block: 'morning' | 'afternoon' | 'evening' = 'morning'
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  if (!tripId || !businessId) {
    console.error('[addBusinessToTrip] Missing tripId or businessId!')
    return { success: false, error: 'Missing tripId or businessId' }
  }

  try {
    // Check if already added
    const { data: existing, error: checkError } = await supabase
      .from('trip_items')
      .select('id')
      .eq('trip_id', tripId)
      .eq('business_id', businessId)
      .maybeSingle()

    if (checkError) {
      console.error('[addBusinessToTrip] Error checking existing:', checkError)
    }

    if (existing) {
      return { success: true } // Already exists, silently succeed
    }

    // Add new item
    const { data, error } = await supabase
      .from('trip_items')
      .insert({
        trip_id: tripId,
        business_id: businessId,
        day_index: dayIndex,
        block: block,
        estimated_cost: 0,
      })
      .select()

    if (error) {
      console.error('[addBusinessToTrip] Error inserting:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('[addBusinessToTrip] Exception:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}
