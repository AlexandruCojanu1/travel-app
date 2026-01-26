/**
 * API wrapper functions for use in components
 * These replace the old Server Actions
 */

import { apiClient } from './api-client'

// Re-export apiClient for direct use
export { apiClient }

// Auth helpers
export async function setAuthToken(token: string | null) {
  apiClient.setAccessToken(token)
}

// Booking functions (replacing actions/booking.ts)
export async function createBooking(params: {
  business_id: string
  room_id: string
  trip_id?: string
  check_in: string
  check_out: string
  guests: number
  rooms_count?: number
  payment_option?: 'full' | 'deposit' | 'on_site'
  guest_name?: string
  guest_email?: string
  cancellation_policy?: 'flexible' | 'moderate' | 'strict'
}) {
  try {
    const booking = await apiClient.createBooking(params)
    return { success: true, booking }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create booking' }
  }
}

export async function calculateBookingPrice(
  roomId: string,
  checkIn: string,
  checkOut: string,
  roomsCount: number = 1
) {
  try {
    return await apiClient.calculateBookingPrice({
      room_id: roomId,
      check_in: checkIn,
      check_out: checkOut,
      rooms_count: roomsCount,
    })
  } catch (error) {
    console.error('Error calculating price:', error)
    return null
  }
}

export async function confirmBooking(bookingId: string) {
  // Note: This would need to be implemented via the booking status update endpoint
  return { success: true }
}

export async function cancelBooking(bookingId: string, reason?: string) {
  try {
    await apiClient.cancelBooking(bookingId, reason)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel booking' }
  }
}

// Business functions (replacing actions/business.ts)
export async function getBusinessById(id: string) {
  try {
    return await apiClient.getBusiness(id)
  } catch (error) {
    console.error('Error fetching business:', error)
    return null
  }
}

export async function recordSwipe(
  userId: string,
  businessId: string,
  direction: 'left' | 'right' | 'like' | 'pass'
) {
  try {
    const action = direction === 'right' || direction === 'like' ? 'like' : 'pass'
    await apiClient.recordSwipe(businessId, action)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to record swipe' }
  }
}

// Profile functions (replacing actions/profile.ts)
export async function saveBusinessForUser(userId: string, businessId: string) {
  try {
    await apiClient.saveBusiness(businessId)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save business' }
  }
}

export async function removeSavedBusiness(userId: string, businessId: string) {
  try {
    await apiClient.unsaveBusiness(businessId)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to remove saved business' }
  }
}

// Trip functions (replacing actions/trips.ts)
export async function addBusinessToTrip(tripId: string, businessId: string, dayIndex?: number) {
  try {
    await apiClient.addBusinessToTrip(tripId, businessId, dayIndex)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add business to trip' }
  }
}

// Room functions (replacing actions/rooms.ts)
export async function getRoomsByHotel(hotelId: string) {
  try {
    const business = await apiClient.getBusiness(hotelId)
    return business?.hotel_rooms || []
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return []
  }
}

// Review functions (replacing actions/reviews.ts)
export async function getBusinessReviews(businessId: string) {
  try {
    const response = await apiClient.getBusinessReviews(businessId)
    return response.reviews || []
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

export async function createReview(params: {
  business_id: string
  user_id: string
  rating: number
  content: string
  images?: string[]
}) {
  try {
    const review = await apiClient.createReview({
      business_id: params.business_id,
      rating: params.rating,
      content: params.content,
      images: params.images,
    })
    return { success: true, review }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create review' }
  }
}

// Weather functions (replacing actions/weather.ts)
export async function getWeatherForecast(latitude: number, longitude: number, cityName: string) {
  try {
    return await apiClient.getWeather(latitude, longitude, cityName)
  } catch (error) {
    console.error('Error fetching weather:', error)
    return null
  }
}

export function filterForecastForVacation(forecast: any, startDate: Date, endDate: Date) {
  if (!forecast?.days) return []
  
  const start = new Date(startDate).toISOString().split('T')[0]
  const end = new Date(endDate).toISOString().split('T')[0]
  
  return forecast.days.filter((day: any) => {
    return day.date >= start && day.date <= end
  })
}

// City functions (replacing actions/cities.ts)
export async function getActiveCities() {
  // For now, fetch from the original Supabase client
  // This will be migrated to backend endpoint
  return []
}

export async function getCities() {
  return []
}

// Gamification functions
export async function getUserPassport() {
  try {
    return await apiClient.getPassport()
  } catch (error) {
    console.error('Error fetching passport:', error)
    return { xp: 0, coins: 0, level: 1, stamps: [] }
  }
}

export async function getUserAchievements() {
  try {
    return await apiClient.getAchievements()
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return []
  }
}

export async function getUserQuests() {
  try {
    return await apiClient.getQuests()
  } catch (error) {
    console.error('Error fetching quests:', error)
    return []
  }
}

export async function startQuest(questId: string) {
  try {
    await apiClient.startQuest(questId)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to start quest' }
  }
}

// Types re-exports
export type { ApiResponse, ApiError } from './api-client'
