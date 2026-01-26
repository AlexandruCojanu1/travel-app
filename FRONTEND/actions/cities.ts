'use server'

import { getActiveCities as getActiveCitiesService, getCities as getCitiesService, getNearestCity as getNearestCityService } from '@/services/auth/city.service'
import type { Database } from '@/types/database.types'

// Use the database type for City
export type City = Database['public']['Tables']['cities']['Row']

/**
 * Get all active cities
 */
export async function getActiveCities(): Promise<City[]> {
  return await getActiveCitiesService()
}

/**
 * Get all cities (including inactive)
 */
export async function getCities(): Promise<City[]> {
  return await getCitiesService()
}

/**
 * Get nearest city to coordinates
 */
export async function getNearestCity(lat: number, lng: number): Promise<City | null> {
  return await getNearestCityService(lat, lng)
}
