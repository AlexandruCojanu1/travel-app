/**
 * Service for calculating real routes using OSRM (Open Source Routing Machine)
 * OSRM public server is free and doesn't require API key
 */

export interface RoutePoint {
  latitude: number
  longitude: number
  name?: string
}

export interface RouteGeometry {
  coordinates: number[][] // [lng, lat] pairs
  type: 'LineString'
}

export interface RouteSegment {
  distance: number // in meters
  duration: number // in seconds
  geometry?: RouteGeometry
}

export interface RouteResult {
  distance: number // total distance in meters
  duration: number // total duration in seconds
  segments: RouteSegment[]
  geometry?: RouteGeometry // full route geometry
}

/**
 * Get OSRM profile for transport mode
 */
function getOSRMProfile(mode: 'walking' | 'driving' | 'cycling'): string {
  switch (mode) {
    case 'walking':
      return 'foot'
    case 'driving':
      return 'car'
    case 'cycling':
      return 'bike'
    default:
      return 'foot'
  }
}

/**
 * Calculate real route between two points using OSRM
 */
async function calculateOSRMRoute(
  from: RoutePoint,
  to: RoutePoint,
  profile: string
): Promise<RouteSegment | null> {
  try {
    // Use OSRM public demo server (free, no API key needed)
    // Format: /route/v1/{profile}/{coordinates}?overview=full&geometries=geojson
    const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`
    const url = `https://router.project-osrm.org/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson&steps=false`
    
    const response = await fetch(url)

    if (!response.ok) {
      console.warn('OSRM API error, falling back to Haversine:', response.status)
      return null
    }

    const data = await response.json()
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      
      return {
        distance: route.distance, // meters
        duration: route.duration, // seconds
        geometry: route.geometry || undefined,
      }
    }

    return null
  } catch (error) {
    console.warn('Error fetching route from OSRM, using fallback:', error)
    return null
  }
}

/**
 * Calculate Haversine distance (fallback)
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

  return R * c
}

/**
 * Calculate route with road distance approximation (fallback)
 */
function calculateRouteSegmentFallback(
  from: RoutePoint,
  to: RoutePoint,
  profile: string
): RouteSegment {
  const straightDistance = calculateHaversineDistance(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude
  )

  // Apply road correction factor
  let roadCorrectionFactor = 1.3
  let speed = 40 / 3.6 // m/s
  
  switch (profile) {
    case 'foot':
      roadCorrectionFactor = 1.15
      speed = 5 / 3.6
      break
    case 'car':
      roadCorrectionFactor = 1.35
      speed = 40 / 3.6
      break
    case 'bike':
      roadCorrectionFactor = 1.25
      speed = 15 / 3.6
      break
  }

  const roadDistance = straightDistance * roadCorrectionFactor
  const duration = roadDistance / speed

  return {
    distance: roadDistance,
    duration,
  }
}

/**
 * Calculate real route for a series of points
 */
export async function calculateRealRoute(
  points: RoutePoint[],
  mode: 'walking' | 'driving' | 'cycling' = 'driving'
): Promise<RouteResult> {
  if (points.length < 2) {
    return {
      distance: 0,
      duration: 0,
      segments: [],
    }
  }

  const profile = getOSRMProfile(mode)
  const segments: RouteSegment[] = []
  let totalDistance = 0
  let totalDuration = 0
  const allCoordinates: number[][] = []

  // Calculate route for each segment
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i]
    const to = points[i + 1]

    // Try to get real route from OSRM
    let segment = await calculateOSRMRoute(from, to, profile)

    // Fallback to approximation if OSRM fails
    if (!segment) {
      segment = calculateRouteSegmentFallback(from, to, profile)
    }

    segments.push(segment)
    totalDistance += segment.distance
    totalDuration += segment.duration

    // Collect coordinates for full route geometry
    if (segment.geometry?.coordinates) {
      if (i === 0) {
        // First segment: add all coordinates
        allCoordinates.push(...segment.geometry.coordinates)
      } else {
        // Subsequent segments: skip first coordinate (same as last of previous)
        allCoordinates.push(...segment.geometry.coordinates.slice(1))
      }
    } else {
      // Fallback: use straight line
      if (i === 0) {
        allCoordinates.push([from.longitude, from.latitude])
      }
      allCoordinates.push([to.longitude, to.latitude])
    }
  }

  return {
    distance: totalDistance,
    duration: totalDuration,
    segments,
    geometry: allCoordinates.length > 0 ? {
      coordinates: allCoordinates,
      type: 'LineString',
    } : undefined,
  }
}

