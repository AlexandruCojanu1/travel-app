/**
 * Directions and route optimization service
 */

export interface RoutePoint {
  latitude: number
  longitude: number
  name?: string
  id?: string
}

export interface Route {
  points: RoutePoint[]
  distance: number // in meters
  duration: number // in seconds
  polyline?: string // encoded polyline for map display
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
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
 * Sort businesses by distance from a reference point
 */
export function sortByDistance(
  businesses: Array<{ latitude: number; longitude: number; [key: string]: any }>,
  referenceLat: number,
  referenceLon: number
): Array<{ distance: number; [key: string]: any }> {
  return businesses
    .map((business) => ({
      ...business,
      distance: calculateDistance(
        referenceLat,
        referenceLon,
        business.latitude,
        business.longitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
}

/**
 * Optimize route using nearest neighbor algorithm (simple TSP approximation)
 */
export function optimizeRoute(points: RoutePoint[]): RoutePoint[] {
  if (points.length <= 2) return points

  const optimized: RoutePoint[] = []
  const remaining = [...points]
  
  // Start with first point
  let current = remaining.shift()!
  optimized.push(current)

  // Greedy: always go to nearest unvisited point
  while (remaining.length > 0) {
    let nearestIndex = 0
    let nearestDistance = calculateDistance(
      current.latitude,
      current.longitude,
      remaining[0].latitude,
      remaining[0].longitude
    )

    for (let i = 1; i < remaining.length; i++) {
      const distance = calculateDistance(
        current.latitude,
        current.longitude,
        remaining[i].latitude,
        remaining[i].longitude
      )
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = i
      }
    }

    current = remaining.splice(nearestIndex, 1)[0]
    optimized.push(current)
  }

  return optimized
}

/**
 * Calculate total route distance and estimated duration
 */
export function calculateRouteMetrics(points: RoutePoint[]): {
  distance: number
  duration: number
} {
  if (points.length < 2) {
    return { distance: 0, duration: 0 }
  }

  let totalDistance = 0
  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistance(
      points[i].latitude,
      points[i].longitude,
      points[i + 1].latitude,
      points[i + 1].longitude
    )
  }

  // Estimate duration: assume average walking speed of 5 km/h
  const walkingSpeed = 5 / 3.6 // m/s
  const duration = totalDistance / walkingSpeed

  return {
    distance: totalDistance,
    duration,
  }
}

/**
 * Get directions URL for Google Maps or Waze
 */
export function getDirectionsUrl(
  points: RoutePoint[],
  provider: 'google' | 'waze' = 'google'
): string {
  if (points.length === 0) return ''

  if (provider === 'waze') {
    // Waze doesn't support waypoints well, so just use destination
    const dest = points[points.length - 1]
    return `https://www.waze.com/ul?ll=${dest.latitude},${dest.longitude}&navigate=yes`
  }

  // Google Maps
  if (points.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&destination=${points[0].latitude},${points[0].longitude}`
  }

  // Multiple waypoints
  const waypoints = points.slice(0, -1)
    .map(p => `${p.latitude},${p.longitude}`)
    .join('|')
  const destination = points[points.length - 1]

  return `https://www.google.com/maps/dir/?api=1&waypoints=${waypoints}&destination=${destination.latitude},${destination.longitude}`
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

