"use server"

import { createClient } from "@/lib/supabase/server"
import { getRankedLocations } from "@/services/recommendation-engine"
import { ApiResponse } from "@/lib/api-response"
import type { RankedLocation } from "@/services/recommendation-engine"

type UserParams = {
  totalBudget: number
  groupSize: number
  days: number
  dates: { start: string; end: string }
  preferences: string[]
  anchorCoords: { lat: number; lng: number }
}

export async function getRecommendations(
  userParams: UserParams,
  category: "hotel" | "restaurant" | "activity",
  currentSpend: number = 0
): Promise<ApiResponse<RankedLocation[]>> {
  try {
    const supabase = await createClient()

    const recommendations = await getRankedLocations(
      supabase,
      userParams,
      category,
      currentSpend
    )

    return {
      success: true,
      data: recommendations,
    }
  } catch (error) {
    console.error("Get recommendations error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get recommendations",
    }
  }
}
