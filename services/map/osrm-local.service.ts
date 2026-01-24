/**
 * Local OSRM Service
 * Handles car and walking routing using local OSRM instance
 */

export interface OSRMPlace {
  lat: number
  lon: number
  name?: string
}

export interface OSRMRouteGeometry {
  type: 'LineString'
  coordinates: number[][] // [lng, lat] pairs
}

export interface OSRMRoute {
  distance: number // meters
  duration: number // seconds
  geometry: OSRMRouteGeometry
  legs: Array<{
    distance: number
    duration: number
    steps: Array<{
      distance: number
      duration: number
      geometry: OSRMRouteGeometry
      maneuver: {
        type: string
        instruction: string
      }
    }>
  }>
}

export interface OSRMRouteResponse {
  code: string
  routes: OSRMRoute[]
  waypoints: Array<{
    location: [number, number] // [lng, lat]
    name?: string
  }>
}

const OSRM_BASE_URL = process.env.NEXT_PUBLIC_OSRM_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : '')

if (!OSRM_BASE_URL && typeof window !== 'undefined') {
  console.warn('OSRM_BASE_URL is not configured - routing features may not work')
}

/**
 * Calculate route between points using local OSRM
 */
export async function calculateOSRMRoute(
  points: OSRMPlace[],
  profile: 'driving' | 'walking' | 'cycling' = 'driving',
  options?: {
    alternatives?: number
    steps?: boolean
    overview?: 'full' | 'simplified' | 'false'
    geometries?: 'geojson' | 'polyline' | 'polyline6'
  }
): Promise<OSRMRoute | null> {
  if (points.length < 2) {
    return null
  }

  try {
    // Build coordinates string: lon,lat;lon,lat;...
    const coordinates = points.map(p => `${p.lon},${p.lat}`).join(';')

    const params = new URLSearchParams({
      overview: options?.overview || 'full',
      geometries: options?.geometries || 'geojson',
      steps: (options?.steps !== undefined ? options.steps : false).toString(),
      alternatives: (options?.alternatives || 0).toString(),
    })

    const url = `${OSRM_BASE_URL}/route/v1/${profile}/${coordinates}?${params.toString()}`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('OSRM API error:', response.status, response.statusText)
      return null
    }

    const data: OSRMRouteResponse = await response.json()

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn('No routes found')
      return null
    }

    // Return the first (best) route
    return data.routes[0]
  } catch (error) {
    console.error('Error calculating OSRM route:', error)
    return null
  }
}

/**
 * Calculate distance matrix between multiple points
 */
export async function calculateDistanceMatrix(
  sources: OSRMPlace[],
  destinations: OSRMPlace[],
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<{
  durations: number[][] // seconds
  distances: number[][] // meters
} | null> {
  try {
    const sourcesCoords = sources.map(s => `${s.lon},${s.lat}`).join(';')
    const destinationsCoords = destinations.map(d => `${d.lon},${d.lat}`).join(';')

    const url = `${OSRM_BASE_URL}/table/v1/${profile}/${sourcesCoords}?destinations=${destinationsCoords}`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.code !== 'Ok') {
      return null
    }

    return {
      durations: data.durations || [],
      distances: data.distances || [],
    }
  } catch (error) {
    console.error('Error calculating distance matrix:', error)
    return null
  }
}

/**
 * Match GPS trace to road network (snap to roads)
 */
export async function matchGPS(
  points: Array<{ lat: number; lon: number; timestamp?: number }>,
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<OSRMRoute | null> {
  try {
    const coordinates = points.map(p => `${p.lon},${p.lat}`).join(';')
    const timestamps = points.map(p => p.timestamp || Date.now()).join(';')

    const url = `${OSRM_BASE_URL}/match/v1/${profile}/${coordinates}?timestamps=${timestamps}&geometries=geojson&overview=full`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const data: OSRMRouteResponse = await response.json()

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null
    }

    return data.routes[0]
  } catch (error) {
    console.error('Error matching GPS trace:', error)
    return null
  }
}

