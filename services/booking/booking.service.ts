import { createClient } from '@/lib/supabase/client'

/**
 * Check if a resource is available for the given date range
 * Critical: Prevents double-booking by checking availability for every day
 */
export async function checkAvailability(
  resourceId: string,
  startDate: string, // ISO date string
  endDate: string // ISO date string
): Promise<{ available: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // Parse dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return { available: false, error: 'Invalid date range' }
    }

    // Generate array of all dates in the range
    const dates: string[] = []
    const currentDate = new Date(start)
    
    while (currentDate < end) {
      dates.push(currentDate.toISOString().split('T')[0]) // YYYY-MM-DD format
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Check availability for each date
    // We need to ensure units_available > 0 for EVERY day in the range
    const { data: availability, error } = await supabase
      .from('resource_availability')
      .select('date, units_available')
      .eq('resource_id', resourceId)
      .in('date', dates)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error checking availability:', error)
      return { available: false, error: error.message }
    }

    if (!availability || availability.length === 0) {
      return { available: false, error: 'No availability data found' }
    }

    // Check if we have availability data for all dates
    if (availability.length < dates.length) {
      return { available: false, error: 'Incomplete availability data' }
    }

    // Critical check: Every day must have units_available > 0
    const allAvailable = availability.every(
      (day: { date: string; units_available: number }) => day.units_available > 0
    )

    if (!allAvailable) {
      return { available: false, error: 'Resource not available for all dates' }
    }

    return { available: true }
  } catch (error) {
    console.error('Error in checkAvailability:', error)
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get resource details including price
 */
export async function getResourceDetails(resourceId: string) {
  const supabase = createClient()

  try {
    const { data: resource, error } = await supabase
      .from('business_resources')
      .select('id, business_id, name, price_per_night')
      .eq('id', resourceId)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    if (!resource) {
      return { success: false, error: 'Resource not found' }
    }

    return { success: true, resource }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get booking details with business information
 */
export async function getBookingDetails(bookingId: string) {
  const supabase = createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Fetch booking with business details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        business:businesses (
          id,
          name,
          image_url,
          rating,
          category
        ),
        resource:business_resources (
          id,
          name,
          price_per_night
        )
      `)
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return { success: false, error: 'Booking not found or unauthorized' }
    }

    return { success: true, booking }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export interface BookingWithDetails {
  id: string
  user_id: string
  resource_id: string
  business_id: string
  start_date: string
  end_date: string
  guest_count: number
  total_amount: number
  status: string
  created_at: string
  updated_at: string
  business: {
    id: string
    name: string
    image_url: string | null
    rating: number | null
    category: string
  } | null
  resource: {
    id: string
    name: string
    price_per_night: number
  } | null
}

/**
 * Get all user bookings grouped by status
 */
export async function getUserBookings(userId: string): Promise<{
  success: boolean
  upcoming?: BookingWithDetails[]
  past?: BookingWithDetails[]
  cancelled?: BookingWithDetails[]
  error?: string
}> {
  const supabase = createClient()

  try {
    // Fetch all bookings with business and resource details
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        business:businesses (
          id,
          name,
          image_url,
          rating,
          category
        ),
        resource:business_resources (
          id,
          name,
          price_per_night
        )
      `)
      .eq('user_id', userId)
      .order('start_date', { ascending: true })

    if (bookingsError) {
      return { success: false, error: bookingsError.message }
    }

    if (!bookings) {
      return {
        success: true,
        upcoming: [],
        past: [],
        cancelled: [],
      }
    }

    const now = new Date()
    const nowDate = now.toISOString().split('T')[0] // YYYY-MM-DD

    // Group bookings
    const upcoming: BookingWithDetails[] = []
    const past: BookingWithDetails[] = []
    const cancelled: BookingWithDetails[] = []

    bookings.forEach((booking: any) => {
      const bookingData = booking as BookingWithDetails

      if (bookingData.status === 'cancelled') {
        cancelled.push(bookingData)
      } else if (bookingData.start_date >= nowDate) {
        upcoming.push(bookingData)
      } else {
        past.push(bookingData)
      }
    })

    // Sort upcoming ASC by start_date
    upcoming.sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )

    // Sort past DESC by start_date
    past.sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    )

    return {
      success: true,
      upcoming,
      past,
      cancelled,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
