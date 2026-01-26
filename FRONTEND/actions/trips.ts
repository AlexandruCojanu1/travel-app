'use server'

import { 
  addBusinessToTrip as addBusinessToTripService
} from '@/services/trip/trip.service'

/**
 * Add a business to a trip
 */
export async function addBusinessToTrip(
  tripId: string, 
  businessId: string, 
  dayIndex?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await addBusinessToTripService(tripId, businessId, dayIndex)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add business to trip' }
  }
}
