"use client"

import { useState, useEffect, useCallback } from "react"
import { getRecommendations } from "@/actions/recommendations"
import { useTripStore } from "@/store/trip-store"
import { useAppStore } from "@/store/app-store"
import { useVacationStore } from "@/store/vacation-store"
import type { RankedLocation } from "@/services/recommendation-engine"

type Category = "hotel" | "restaurant" | "activity"

export function useRecommendations(category: Category) {
  const { tripDetails, budget, items } = useTripStore()
  const { currentCity } = useAppStore()
  const { getActiveVacation } = useVacationStore()
  
  const [recommendations, setRecommendations] = useState<RankedLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateCurrentSpend = useCallback(() => {
    return items.reduce((sum, item) => sum + (item.estimated_cost || 0), 0)
  }, [items])

  const getAnchorCoords = useCallback(() => {
    // If we have a selected hotel, use its coordinates
    const hotelItem = items.find(
      (item) => item.business_category?.toLowerCase().includes("hotel")
    )
    
    if (hotelItem && tripDetails?.metadata?.hotelCoords) {
      return tripDetails.metadata.hotelCoords
    }
    
    // Otherwise use city center
    if (currentCity?.center_lat && currentCity?.center_lng) {
      return {
        lat: currentCity.center_lat,
        lng: currentCity.center_lng,
      }
    }
    
    // Fallback to city coordinates
    if (currentCity?.latitude && currentCity?.longitude) {
      return {
        lat: currentCity.latitude,
        lng: currentCity.longitude,
      }
    }
    
    return { lat: 0, lng: 0 }
  }, [items, tripDetails, currentCity])

  const fetchRecommendations = useCallback(async () => {
    if (!tripDetails || !budget || !currentCity) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const activeVacation = getActiveVacation()
      // Extract preferences from metadata (can be array or object)
      let preferences: string[] = []
      if (tripDetails.metadata?.preferences) {
        if (Array.isArray(tripDetails.metadata.preferences)) {
          preferences = tripDetails.metadata.preferences
        } else if (typeof tripDetails.metadata.preferences === 'object') {
          // If it's an object, extract values
          preferences = Object.values(tripDetails.metadata.preferences).filter(
            (v): v is string => typeof v === 'string'
          )
        }
      }
      
      const userParams = {
        totalBudget: budget.total,
        groupSize: tripDetails.guests,
        days: Math.ceil(
          (new Date(tripDetails.endDate).getTime() -
            new Date(tripDetails.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        dates: {
          start: tripDetails.startDate,
          end: tripDetails.endDate,
        },
        preferences: Array.isArray(preferences) ? preferences : [],
        anchorCoords: getAnchorCoords(),
      }

      const currentSpend = calculateCurrentSpend()
      const result = await getRecommendations(userParams, category, currentSpend)

      if (result.success && result.data) {
        setRecommendations(result.data)
      } else {
        setError(result.success === false ? result.error : "Failed to get recommendations")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [tripDetails, budget, currentCity, category, calculateCurrentSpend, getAnchorCoords, getActiveVacation])

  useEffect(() => {
    if (tripDetails && budget && currentCity) {
      fetchRecommendations()
    }
  }, [tripDetails, budget, currentCity, category, fetchRecommendations])

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations,
  }
}
