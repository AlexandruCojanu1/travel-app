/**
 * OpenTripPlanner (OTP) Service
 * Handles public transit routing with automatic Walk -> Transit -> Walk segments
 */

export interface OTPPlace {
  lat: number
  lon: number
  name?: string
}

export interface OTPItinerary {
  duration: number // seconds
  walkTime: number // seconds
  transitTime: number // seconds
  waitingTime: number // seconds
  transfers: number
  fare?: {
    type: string
    currency: string
    cents: number
  }
  legs: OTPLeg[]
  geometry: {
    type: 'LineString'
    coordinates: number[][] // [lng, lat] pairs
  }
}

export interface OTPLeg {
  mode: 'WALK' | 'BUS' | 'TRAM' | 'SUBWAY' | 'RAIL'
  from: {
    lat: number
    lon: number
    name: string
    stopId?: string
    stopCode?: string
  }
  to: {
    lat: number
    lon: number
    name: string
    stopId?: string
    stopCode?: string
  }
  startTime: number // Unix timestamp (ms)
  endTime: number // Unix timestamp (ms)
  duration: number // seconds
  distance: number // meters
  route?: {
    shortName: string
    longName: string
    type: number
    color?: string
  }
  tripId?: string
  geometry?: {
    type: 'LineString'
    coordinates: number[][]
  }
}

export interface OTPRouteResponse {
  plan: {
    itineraries: OTPItinerary[]
  }
}

const OTP_BASE_URL = process.env.NEXT_PUBLIC_OTP_URL || 'http://localhost:8080'

/**
 * Plan a transit route using OpenTripPlanner
 */
export async function planTransitRoute(
  from: OTPPlace,
  to: OTPPlace,
  options?: {
    date?: Date
    time?: string // HH:mm format
    arriveBy?: boolean
    maxWalkDistance?: number // meters, default 2000
    modes?: string // e.g., "WALK,BUS,TRAM"
    wheelchair?: boolean
  }
): Promise<OTPItinerary | null> {
  try {
    const date = options?.date || new Date()
    const time = options?.time || 
      `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    
    const params = new URLSearchParams({
      from: `${from.lat},${from.lon}`,
      to: `${to.lat},${to.lon}`,
      date: dateStr,
      time: time,
      arriveBy: options?.arriveBy ? 'true' : 'false',
      maxWalkDistance: (options?.maxWalkDistance || 2000).toString(),
      mode: options?.modes || 'WALK,TRANSIT',
      wheelchair: options?.wheelchair ? 'true' : 'false',
    })

    const url = `${OTP_BASE_URL}/otp/routers/default/plan?${params.toString()}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('OTP API error:', response.status, response.statusText)
      return null
    }

    const data: OTPRouteResponse = await response.json()

    if (!data.plan || !data.plan.itineraries || data.plan.itineraries.length === 0) {
      console.warn('No itineraries found')
      return null
    }

    // Return the first (best) itinerary
    const itinerary = data.plan.itineraries[0]
    
    // Build combined geometry from all legs
    const allCoordinates: number[][] = []
    itinerary.legs.forEach((leg, index) => {
      if (leg.geometry && leg.geometry.coordinates) {
        if (index === 0) {
          // First leg: add all coordinates
          allCoordinates.push(...leg.geometry.coordinates)
        } else {
          // Subsequent legs: skip first coordinate (same as last of previous)
          allCoordinates.push(...leg.geometry.coordinates.slice(1))
        }
      } else {
        // Fallback: straight line
        if (index === 0) {
          allCoordinates.push([leg.from.lon, leg.from.lat])
        }
        allCoordinates.push([leg.to.lon, leg.to.lat])
      }
    })

    return {
      ...itinerary,
      geometry: {
        type: 'LineString',
        coordinates: allCoordinates,
      },
    }
  } catch (error) {
    console.error('Error planning transit route:', error)
    return null
  }
}

/**
 * Get transit stops near a location
 */
export async function getNearbyStops(
  lat: number,
  lon: number,
  radius: number = 500 // meters
): Promise<Array<{
  id: string
  name: string
  lat: number
  lon: number
  code?: string
}>> {
  try {
    const url = `${OTP_BASE_URL}/otp/routers/default/index/stops?lat=${lat}&lon=${lon}&radius=${radius}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    
    if (!data || !Array.isArray(data)) {
      return []
    }

    return data.map((stop: any) => ({
      id: stop.id,
      name: stop.name,
      lat: stop.lat,
      lon: stop.lon,
      code: stop.code,
    }))
  } catch (error) {
    console.error('Error fetching nearby stops:', error)
    return []
  }
}

/**
 * Get route information by ID
 */
export async function getRouteInfo(routeId: string): Promise<{
  id: string
  shortName: string
  longName: string
  type: number
  color?: string
  textColor?: string
} | null> {
  try {
    const url = `${OTP_BASE_URL}/otp/routers/default/index/routes/${routeId}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    return {
      id: data.id,
      shortName: data.shortName,
      longName: data.longName,
      type: data.type,
      color: data.color,
      textColor: data.textColor,
    }
  } catch (error) {
    console.error('Error fetching route info:', error)
    return null
  }
}

