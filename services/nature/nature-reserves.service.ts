import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export interface NatureReserve {
  id: string
  name: string
  city_id: string
  category: string
  latitude: number
  longitude: number
  description: string | null
  area_hectares: number | null
  iucn_category: string | null
  reserve_type: string | null
  image_url: string | null
}

interface SupabaseNatureReserve {
  id: string
  name: string
  city_id: string
  category: string | null
  latitude: number | null
  longitude: number | null
  lat?: number | null
  lng?: number | null
  description: string | null
  area_hectares: number | null
  iucn_category: string | null
  reserve_type: string | null
  image_url: string | null
  attributes?: {
    latitude?: number
    longitude?: number
    lat?: number
    lng?: number
    area_hectares?: number
    iucn_category?: string
    reserve_type?: string
    image_url?: string
  }
}

/**
 * Get nature reserves for a specific city
 * NOTE: Nature reserves are already displayed on the map via businesses table
 * This function returns empty array as reserves are handled through businesses
 */
export async function getNatureReservesForCity(_cityId: string): Promise<NatureReserve[]> {
  // Nature reserves are already in the map via businesses table
  // No need to fetch separately
  return []
}

/**
 * Get recreation areas for a specific city
 * NOTE: Recreation areas are already displayed on the map via businesses table
 * This function returns empty array as recreation areas are handled through businesses
 */
export async function getRecreationAreasForCity(_cityId: string): Promise<Array<{
  name: string
  latitude: number
  longitude: number
  description: string
  category: string
}>> {
  // Recreation areas are already in the map via businesses table
  // No need to fetch separately
  return []
}


