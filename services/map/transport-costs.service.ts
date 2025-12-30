/**
 * Service for calculating transportation costs and distances
 * Uses real routing when possible, falls back to Haversine
 */

import { calculateRealRoute, type RoutePoint as RoutingPoint } from './osrm-routing.service'
import { calculateTransitRoute } from './transit-routing.service'

export type TransportMode = 
  | 'walking' 
  | 'transit' 
  | 'walking-transit' 
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
      // Walking: free, ~5 km/h average speed
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

    case 'walking-transit':
      // Mixed: assume 50% walking, 50% transit
      // Walking part: free
      // Transit part: 5 RON
      const walkingDistance = distance * 0.5
      const transitDistance = distance * 0.5
      return {
        cost: 5, // One transit ticket
        duration: Math.round(
          (walkingDistance / 5) * 60 + (transitDistance / 20) * 60
        ),
      }

    case 'car':
      // Car: fuel cost ~6 RON/liter, consumption ~7L/100km
      // Cost per km: (6 * 7) / 100 = 0.42 RON/km
      // Average speed: ~40 km/h in city
      return {
        cost: distance * 0.42,
        duration: Math.round((distance / 40) * 60), // minutes
      }

    case 'taxi':
      // Taxi/Uber/Bolt: 3 RON per km
      // Average speed: ~30 km/h in city
      return {
        cost: distance * 3,
        duration: Math.round((distance / 30) * 60), // minutes
      }

    default:
      return { cost: 0, duration: 0 }
  }
}

/**
 * Calculate transportation costs for a route
 * Uses OSRM for real routes (walking, driving, cycling)
 * Uses GTFS for transit routes
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

  // Determine routing mode based on transport mode
  let routingMode: 'walking' | 'driving' | 'cycling' = 'driving'
  if (mode === 'walking' || mode === 'walking-transit') {
    routingMode = 'walking'
  } else if (mode === 'car' || mode === 'taxi') {
    routingMode = 'driving'
  }

  // Convert to routing points
  const routingPoints: RoutingPoint[] = validPoints.map(p => ({
    latitude: p.latitude,
    longitude: p.longitude,
    name: p.name,
  }))

  // Calculate routes - use transit routing for transit modes
  let routeResult
  let isRealRoute = false
  
  try {
    if (mode === 'transit' || mode === 'walking-transit') {
      // Use transit routing
      if (cityName && routingPoints.length >= 2) {
        const firstPoint = routingPoints[0]
        const lastPoint = routingPoints[routingPoints.length - 1]
        
        if (firstPoint && lastPoint) {
          try {
            const transitResult = await calculateTransitRoute(
              { 
                lat: firstPoint.latitude, 
                lng: firstPoint.longitude, 
                name: firstPoint.name || undefined 
              },
              { 
                lat: lastPoint.latitude, 
                lng: lastPoint.longitude, 
                name: lastPoint.name || undefined 
              },
              cityName
            )
            
            if (transitResult && transitResult.segments && transitResult.segments.length > 0) {
              routeResult = {
                distance: transitResult.totalDistance,
                duration: transitResult.totalDuration,
                segments: transitResult.segments.map(s => ({
                  distance: s.distance || 0,
                  duration: s.duration || 0,
                })),
              }
              isRealRoute = true
            }
          } catch (transitError) {
            console.warn('Error calculating transit route:', transitError)
          }
        }
      }
      
      // Fallback if transit routing fails
      if (!routeResult || !routeResult.segments || routeResult.segments.length === 0) {
        routeResult = await calculateRealRoute(routingPoints, 'walking')
        isRealRoute = routeResult.segments.length > 0 && routeResult.geometry !== undefined
      }
    } else {
      // Use OSRM for walking, driving, cycling
      routeResult = await calculateRealRoute(routingPoints, routingMode)
      isRealRoute = routeResult.segments.length > 0 && routeResult.geometry !== undefined
    }
  } catch (error) {
    console.warn('Error calculating routes, using fallback:', error)
    routeResult = {
      distance: 0,
      duration: 0,
      segments: [],
    }
  }

  // If no real routes, fallback to Haversine
  if (!routeResult || routeResult.segments.length === 0) {
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
  const segments: TransportSegment[] = []
  let totalCost = 0

  for (let i = 0; i < routeResult.segments.length; i++) {
    const segment = routeResult.segments[i]
    const from = validPoints[i]
    const to = validPoints[i + 1]

    // Safety check - skip if points are missing
    if (!from || !to || !segment) {
      continue
    }

    // Convert distance from meters to km
    const distanceKm = segment.distance / 1000
    // Convert duration from seconds to minutes
    const durationMin = Math.round(segment.duration / 60)

    const { cost } = calculateSegmentCost(distanceKm, mode)

    segments.push({
      from: from.name || `Punct ${i + 1}`,
      to: to.name || `Punct ${i + 2}`,
      distance: Math.round(distanceKm * 100) / 100,
      duration: durationMin,
      cost: Math.round(cost * 100) / 100,
    })

    totalCost += cost
  }

  return {
    mode,
    totalDistance: Math.round((routeResult.distance / 1000) * 100) / 100, // Convert to km
    totalDuration: Math.round(routeResult.duration / 60), // Convert to minutes
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
    case 'walking-transit':
      return 'Pe jos + Transport'
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
    case 'walking-transit':
      return '🚶🚌'
    case 'car':
      return '🚗'
    case 'taxi':
      return '🚕'
    default:
      return '📍'
  }
}

