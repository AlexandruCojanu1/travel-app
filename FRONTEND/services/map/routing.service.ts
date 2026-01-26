/**
 * Service for calculating routes with road distance approximation
 * Uses Haversine with road correction factor (no external API needed)
 */

export interface RoutePoint {
  latitude: number
  longitude: number
  name?: string
}

export interface RouteSegment {
  distance: number // in meters
  duration: number // in seconds
  geometry?: number[][] // coordinates for drawing the route
}

export interface RouteResult {
  distance: number // total distance in meters
  duration: number // total duration in seconds
  segments: RouteSegment[]
  geometry?: number[][] // full route geometry
}

/**
 * Get routing profile for transport mode
 */
function getRoutingProfile(mode: 'walking' | 'driving' | 'cycling'): string {
  switch (mode) {
    case 'walking':
      return 'foot-walking'
    case 'driving':
      return 'driving-car'
    case 'cycling':
      return 'cycling-regular'
    default:
      return 'foot-walking'
  }
}

/**
 * Calculate route segment with road distance approximation
 * Uses Haversine with correction factor to approximate road distance
 */
function calculateRouteSegment(
  from: RoutePoint,
  to: RoutePoint,
  profile: string
): RouteSegment {
  // Calculate straight-line distance using Haversine
  const straightDistance = calculateHaversineDistance(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude
  )

  // Apply road correction factor based on profile
  // Roads are typically 1.2-1.5x longer than straight line in cities
  let roadCorrectionFactor = 1.3 // Default for driving
  let speed = 40 / 3.6 // m/s - default for driving (40 km/h)

  switch (profile) {
    case 'foot-walking':
      roadCorrectionFactor = 1.15 // Walking paths are closer to straight line
      speed = 5 / 3.6 // 5 km/h walking speed
      break
    case 'driving-car':
      roadCorrectionFactor = 1.35 // Roads are more circuitous
      speed = 40 / 3.6 // 40 km/h city driving
      break
    case 'cycling-regular':
      roadCorrectionFactor = 1.25 // Bike paths are somewhat circuitous
      speed = 15 / 3.6 // 15 km/h cycling
      break
  }

  const roadDistance = straightDistance * roadCorrectionFactor
  const duration = roadDistance / speed // seconds

  return {
    distance: roadDistance, // meters
    duration, // seconds
  }
}

/**
 * Calculate distance using Haversine formula (fallback)
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // distance in meters
}

/**
 * Calculate route using OSRM API via our proxy endpoint
 * Falls back to Haversine calculation if API fails
 */
export async function calculateOSRMRoute(
  points: RoutePoint[],
  mode: 'walking' | 'driving' | 'cycling' = 'driving'
): Promise<RouteResult & { isRealRoute: boolean }> {
  if (points.length < 2) {
    return {
      distance: 0,
      duration: 0,
      segments: [],
      isRealRoute: false,
    }
  }

  // Build coordinates string for OSRM: "lon1,lat1;lon2,lat2;..."
  const coordinates = points
    .map(p => `${p.longitude},${p.latitude}`)
    .join(';')

  try {
    const response = await fetch(
      `/api/route?coordinates=${encodeURIComponent(coordinates)}&profile=${mode}`
    )

    if (!response.ok) {
      throw new Error('API request failed')
    }

    const data = await response.json()

    if (data.error || data.fallback) {
      throw new Error(data.error || 'No route found')
    }

    // Calculate segments from the overall route
    const segments: RouteSegment[] = []
    for (let i = 0; i < points.length - 1; i++) {
      // Approximate segment distance based on proportion
      const segmentDistance = data.distance / (points.length - 1)
      const segmentDuration = data.duration / (points.length - 1)
      segments.push({
        distance: segmentDistance,
        duration: segmentDuration,
      })
    }

    return {
      distance: data.distance,
      duration: data.duration,
      segments,
      geometry: data.geometry, // Real road geometry from OSRM
      isRealRoute: true,
    }
  } catch (error) {
    console.warn('OSRM routing failed, using fallback:', error)
    // Fallback to Haversine calculation
    const fallbackResult = calculateRealRoute(points, mode)
    return {
      ...fallbackResult,
      isRealRoute: false,
    }
  }
}

/**
 * Calculate route for a series of points with road distance approximation (fallback)
 */
export function calculateRealRoute(
  points: RoutePoint[],
  mode: 'walking' | 'driving' | 'cycling' = 'driving'
): RouteResult {
  if (points.length < 2) {
    return {
      distance: 0,
      duration: 0,
      segments: [],
    }
  }

  const profile = getRoutingProfile(mode)
  const segments: RouteSegment[] = []
  let totalDistance = 0
  let totalDuration = 0

  // Calculate route for each segment
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i]
    const to = points[i + 1]

    const segment = calculateRouteSegment(from, to, profile)

    segments.push(segment)
    totalDistance += segment.distance
    totalDuration += segment.duration
  }

  // Build geometry from points (straight lines between points)
  const geometry: number[][] = points.map(point => [point.longitude, point.latitude])

  return {
    distance: totalDistance,
    duration: totalDuration,
    segments: segments.map(seg => ({
      ...seg,
      geometry: undefined,
    })),
    geometry,
  }
}

/**
 * Batch calculate routes for multiple segments
 */
export function calculateRealRoutesBatch(
  points: RoutePoint[],
  mode: 'walking' | 'driving' | 'cycling' = 'driving'
): RouteResult {
  // Use the same function - no async needed anymore
  return calculateRealRoute(points, mode)
}

