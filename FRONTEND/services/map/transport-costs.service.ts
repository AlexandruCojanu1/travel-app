/**
 * Service for calculating transportation costs and distances
 * Uses local routing calculation (Haversine with correction factors)
 * No Docker, no external services needed
 */

import { calculateRealRoute } from './routing.service'
import type { RoutePoint } from './routing.service'

export type TransportMode = 
  | 'walking' 
  | 'transit' 
  | 'car' 
  | 'taxi'

export interface TransportCost {
  mode: TransportMode
  totalDistance: number // in km
  totalDuration: number // in minutes
  totalCost: number // in RON
  segments: TransportSegment[]
  isRealRoute?: boolean // indicates if real routing was used
}

export interface TransportSegment {
  from: string
  to: string
  distance: number // in km
  duration: number // in minutes
  cost: number // in RON
  // Transit-specific fields
  route?: {
    shortName: string
    longName: string
  }
  stopFrom?: { name: string }
  stopTo?: { name: string }
  schedule?: Array<{ arrivalTime: string; departureTime: string }>
  walkingDistance?: number
  mode?: 'WALK' | 'BUS' | 'TRAM' | 'SUBWAY' | 'RAIL'
}

/**
 * Calculate distance between two points using Haversine formula (fallback)
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate cost for a single segment based on transport mode
 */
function calculateSegmentCost(
  distance: number,
  mode: TransportMode
): { cost: number; duration: number } {
  switch (mode) {
    case 'walking':
      // Walking: free, ~5 km/h average speed (realistic)
      return {
        cost: 0,
        duration: Math.round((distance / 5) * 60), // minutes
      }

    case 'transit':
      // Public transit: 5 RON per ticket (assume one ticket per segment)
      // Average speed: ~20 km/h including stops
      return {
        cost: 5,
        duration: Math.round((distance / 20) * 60), // minutes
      }

    case 'car':
      // Car: fuel cost ~6 RON/liter, consumption ~7L/100km
      // Cost per km: (6 * 7) / 100 = 0.42 RON/km
      // Average speed: ~50 km/h in city (more realistic)
      return {
        cost: distance * 0.42,
        duration: Math.round((distance / 50) * 60), // minutes
      }

    case 'taxi':
      // Taxi/Uber/Bolt: 3 RON per km
      // Average speed: ~40 km/h in city (more realistic)
      return {
        cost: distance * 3,
        duration: Math.round((distance / 40) * 60), // minutes
      }

    default:
      return { cost: 0, duration: 0 }
  }
}

/**
 * Calculate transportation costs for a route
 * Uses local routing calculation (no Docker, no external services)
 */
export async function calculateTransportCosts(
  points: Array<{ latitude: number; longitude: number; name?: string }>,
  mode: TransportMode,
  cityName?: string
): Promise<TransportCost> {
  if (!points || points.length < 2) {
    return {
      mode,
      totalDistance: 0,
      totalDuration: 0,
      totalCost: 0,
      segments: [],
      isRealRoute: false,
    }
  }

  // Validate all points have valid coordinates
  const validPoints = points.filter(
    (p) => 
      p != null && 
      typeof p.latitude === 'number' && 
      !isNaN(p.latitude) &&
      typeof p.longitude === 'number' && 
      !isNaN(p.longitude) &&
      p.latitude >= -90 && p.latitude <= 90 &&
      p.longitude >= -180 && p.longitude <= 180
  )

  if (validPoints.length < 2) {
    return {
      mode,
      totalDistance: 0,
      totalDuration: 0,
      totalCost: 0,
      segments: [],
      isRealRoute: false,
    }
  }

  // Calculate routes using local routing (no Docker, no external services)
  let routeResult: {
    distance: number
    duration: number
    segments: TransportSegment[]
    geometry?: { coordinates: number[][] }
  } | null = null
  let isRealRoute = false
  
  try {
    // Convert to routing points
    const routingPoints: RoutePoint[] = validPoints.map(p => ({
      latitude: p.latitude,
      longitude: p.longitude,
      name: p.name,
    }))
    
    // Determine routing mode
    let routingMode: 'walking' | 'driving' | 'cycling' = 'driving'
    if (mode === 'walking') {
      routingMode = 'walking'
    } else if (mode === 'car' || mode === 'taxi') {
      routingMode = 'driving'
    }
    
    // Use local routing service (Haversine with correction factors)
    const localRoute = calculateRealRoute(routingPoints, routingMode)
    
    if (localRoute && localRoute.segments.length > 0) {
      const segments: TransportSegment[] = localRoute.segments.map((seg, index) => {
        const from = validPoints[index]
        const to = validPoints[index + 1]
        const distanceKm = seg.distance / 1000
        const durationMin = Math.round(seg.duration / 60)
        
        const { cost } = calculateSegmentCost(distanceKm, mode)
        
        return {
          distance: Math.round(distanceKm * 100) / 100,
          duration: durationMin,
          from: from.name || `Punct ${index + 1}`,
          to: to.name || `Punct ${index + 2}`,
          cost: Math.round(cost * 100) / 100,
        }
      })
      
      routeResult = {
        distance: localRoute.distance / 1000, // Convert to km
        duration: Math.round(localRoute.duration / 60), // Convert to minutes
        segments,
        geometry: localRoute.geometry ? { coordinates: localRoute.geometry } : undefined,
      }
      isRealRoute = true // Local calculation is "real" enough for our purposes
    }
  } catch (error) {
    console.warn('Error calculating routes, using fallback:', error)
    routeResult = null
  }

  // If no real routes, fallback to Haversine
  if (!routeResult || !routeResult.segments || routeResult.segments.length === 0) {
    // Fallback calculation
    const segments: TransportSegment[] = []
    let totalDistance = 0
    let totalDuration = 0
    let totalCost = 0

    for (let i = 0; i < validPoints.length - 1; i++) {
      const from = validPoints[i]
      const to = validPoints[i + 1]

      const distance = calculateHaversineDistance(
        from.latitude,
        from.longitude,
        to.latitude,
        to.longitude
      )

      if (isNaN(distance) || !isFinite(distance) || distance < 0) {
        continue
      }

      const { cost, duration } = calculateSegmentCost(distance, mode)

      segments.push({
        from: from.name || `Punct ${i + 1}`,
        to: to.name || `Punct ${i + 2}`,
        distance: Math.round(distance * 100) / 100,
        duration: Math.max(0, duration),
        cost: Math.round(cost * 100) / 100,
      })

      totalDistance += distance
      totalDuration += Math.max(0, duration)
      totalCost += cost
    }

    return {
      mode,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalDuration: Math.max(0, totalDuration),
      totalCost: Math.round(totalCost * 100) / 100,
      segments,
      isRealRoute: false,
    }
  }

  // Use real route data
  const segments: TransportSegment[] = routeResult.segments
  let totalCost = segments.reduce((sum, seg) => sum + seg.cost, 0)

  // Calculate total duration - use route duration if realistic, otherwise calculate manually
  let totalDuration: number
  const totalDistanceKm = routeResult.distance
  const routeDurationMin = routeResult.duration
  
  if (mode === 'walking') {
    // For walking, verify route duration is realistic (3-6 km/h)
    const calculatedSpeed = totalDistanceKm / (routeDurationMin / 60) // km/h
    if (calculatedSpeed >= 3 && calculatedSpeed <= 6 && routeDurationMin > 0) {
      totalDuration = routeDurationMin
    } else {
      // Fallback: 5 km/h
      totalDuration = Math.round((totalDistanceKm / 5) * 60)
    }
  } else if (mode === 'car') {
    // For car, verify route duration is realistic (30-70 km/h)
    const calculatedSpeed = totalDistanceKm / (routeDurationMin / 60) // km/h
    if (calculatedSpeed >= 30 && calculatedSpeed <= 70 && routeDurationMin > 0) {
      totalDuration = routeDurationMin
    } else {
      // Fallback: 50 km/h
      totalDuration = Math.round((totalDistanceKm / 50) * 60)
    }
  } else if (mode === 'taxi') {
    // For taxi, verify route duration is realistic (25-60 km/h)
    const calculatedSpeed = totalDistanceKm / (routeDurationMin / 60) // km/h
    if (calculatedSpeed >= 25 && calculatedSpeed <= 60 && routeDurationMin > 0) {
      totalDuration = routeDurationMin
    } else {
      // Fallback: 40 km/h
      totalDuration = Math.round((totalDistanceKm / 40) * 60)
    }
  } else {
    // For transit, use the calculated duration
    totalDuration = routeDurationMin
  }

  return {
    mode,
    totalDistance: Math.round(totalDistanceKm * 100) / 100,
    totalDuration,
    totalCost: Math.round(totalCost * 100) / 100,
    segments,
    isRealRoute,
  }
}

/**
 * Get display name for transport mode
 */
export function getTransportModeLabel(mode: TransportMode): string {
  switch (mode) {
    case 'walking':
      return 'Mers pe jos'
    case 'transit':
      return 'Transport în comun'
    case 'car':
      return 'Mașină personală'
    case 'taxi':
      return 'Taxi/Uber/Bolt'
    default:
      return 'Necunoscut'
  }
}

/**
 * Get icon for transport mode
 */
export function getTransportModeIcon(mode: TransportMode): string {
  switch (mode) {
    case 'walking':
      return '🚶'
    case 'transit':
      return '🚌'
    case 'car':
      return '🚗'
    case 'taxi':
      return '🚕'
    default:
      return '📍'
  }
}
