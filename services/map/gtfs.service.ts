/**
 * GTFS (General Transit Feed Specification) Service
 * Parses and provides transit data for display on map
 */

export interface GTFSStop {
  stop_id: string
  stop_name: string
  stop_desc: string | null
  stop_lat: number
  stop_lon: number
  location_type: number
  platform_code: string | null
  parent_station: string | null
}

export interface GTFSRoute {
  route_id: string
  agency_id: string
  route_short_name: string
  route_type: number // 0=Tram, 1=Subway, 2=Rail, 3=Bus, etc.
  route_color: string
  route_text_color: string
  route_long_name: string
}

export interface GTFSShape {
  shape_id: string
  shape_pt_lat: number
  shape_pt_lon: number
  shape_pt_sequence: number
  shape_dist_traveled: number | null
}

export interface TransitStop {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  routeIds: string[]
  routeNames: string[]
  routeType: number
}

export interface TransitRoute {
  id: string
  shortName: string
  longName: string
  type: number
  color: string
  textColor: string
  shape: Array<{ lat: number; lng: number }>
  stops: TransitStop[]
}

// Route type mapping
export const ROUTE_TYPE_NAMES: Record<number, string> = {
  0: 'Tramvai',
  1: 'Metrou',
  2: 'Tren',
  3: 'Autobuz',
  4: 'Ferry',
  5: 'Cable Car',
  6: 'Gondola',
  7: 'Funicular',
  11: 'Trolleybus',
  12: 'Monorail',
}

// Cache for parsed data
let stopsCache: Map<string, GTFSStop> | null = null
let routesCache: Map<string, GTFSRoute> | null = null
let shapesCache: Map<string, GTFSShape[]> | null = null
let tripsCache: Map<string, { route_id: string; shape_id: string }> | null = null

/**
 * Parse CSV line
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

/**
 * Load and parse stops.txt
 */
async function loadStops(feedPath: string): Promise<Map<string, GTFSStop>> {
  if (stopsCache) return stopsCache

  try {
    const response = await fetch(`/gtfs/${feedPath}/stops.txt`)
    if (!response.ok) {
      console.error(`Failed to load stops.txt: ${response.statusText}`)
      return new Map()
    }
    const text = await response.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) return new Map()

    const headers = parseCSVLine(lines[0])
    const stops = new Map<string, GTFSStop>()

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length < headers.length) continue

      const stop: GTFSStop = {
        stop_id: values[headers.indexOf('stop_id')] || '',
        stop_name: values[headers.indexOf('stop_name')] || '',
        stop_desc: values[headers.indexOf('stop_desc')] || null,
        stop_lat: parseFloat(values[headers.indexOf('stop_lat')] || '0'),
        stop_lon: parseFloat(values[headers.indexOf('stop_lon')] || '0'),
        location_type: parseInt(values[headers.indexOf('location_type')] || '0'),
        platform_code: values[headers.indexOf('platform_code')] || null,
        parent_station: values[headers.indexOf('parent_station')] || null,
      }

      // Only include stops with valid coordinates
      if (stop.stop_lat && stop.stop_lon && stop.location_type === 0) {
        stops.set(stop.stop_id, stop)
      }
    }

    stopsCache = stops
    return stops
  } catch (error) {
    console.error('Error loading stops:', error)
    return new Map()
  }
}

/**
 * Load and parse routes.txt
 */
async function loadRoutes(feedPath: string): Promise<Map<string, GTFSRoute>> {
  if (routesCache) return routesCache

  try {
    const response = await fetch(`/gtfs/${feedPath}/routes.txt`)
    if (!response.ok) {
      console.error(`Failed to load routes.txt: ${response.statusText}`)
      return new Map()
    }
    const text = await response.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) return new Map()

    const headers = parseCSVLine(lines[0])
    const routes = new Map<string, GTFSRoute>()

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length < headers.length) continue

      const route: GTFSRoute = {
        route_id: values[headers.indexOf('route_id')] || '',
        agency_id: values[headers.indexOf('agency_id')] || '',
        route_short_name: values[headers.indexOf('route_short_name')] || '',
        route_type: parseInt(values[headers.indexOf('route_type')] || '3'),
        route_color: values[headers.indexOf('route_color')] || '1D71B8',
        route_text_color: values[headers.indexOf('route_text_color')] || 'FFFFFF',
        route_long_name: values[headers.indexOf('route_long_name')] || '',
      }

      if (route.route_id) {
        routes.set(route.route_id, route)
      }
    }

    routesCache = routes
    return routes
  } catch (error) {
    console.error('Error loading routes:', error)
    return new Map()
  }
}

/**
 * Load and parse shapes.txt
 */
async function loadShapes(feedPath: string): Promise<Map<string, GTFSShape[]>> {
  if (shapesCache) return shapesCache

  try {
    const response = await fetch(`/gtfs/${feedPath}/shapes.txt`)
    if (!response.ok) {
      console.error(`Failed to load shapes.txt: ${response.statusText}`)
      return new Map()
    }
    const text = await response.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) return new Map()

    const headers = parseCSVLine(lines[0])
    const shapesMap = new Map<string, GTFSShape[]>()

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length < headers.length) continue

      const shape: GTFSShape = {
        shape_id: values[headers.indexOf('shape_id')] || '',
        shape_pt_lat: parseFloat(values[headers.indexOf('shape_pt_lat')] || '0'),
        shape_pt_lon: parseFloat(values[headers.indexOf('shape_pt_lon')] || '0'),
        shape_pt_sequence: parseInt(values[headers.indexOf('shape_pt_sequence')] || '0'),
        shape_dist_traveled: values[headers.indexOf('shape_dist_traveled')] 
          ? parseFloat(values[headers.indexOf('shape_dist_traveled')]) 
          : null,
      }

      if (shape.shape_id) {
        if (!shapesMap.has(shape.shape_id)) {
          shapesMap.set(shape.shape_id, [])
        }
        shapesMap.get(shape.shape_id)!.push(shape)
      }
    }

    // Sort by sequence for each shape
    shapesMap.forEach((points, shapeId) => {
      points.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
    })

    shapesCache = shapesMap
    return shapesMap
  } catch (error) {
    console.error('Error loading shapes:', error)
    return new Map()
  }
}

/**
 * Load and parse trips.txt to get route-shape mapping
 */
async function loadTrips(feedPath: string): Promise<Map<string, { route_id: string; shape_id: string }>> {
  if (tripsCache) return tripsCache

  try {
    const response = await fetch(`/gtfs/${feedPath}/trips.txt`)
    if (!response.ok) {
      console.error(`Failed to load trips.txt: ${response.statusText}`)
      return new Map()
    }
    const text = await response.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) return new Map()

    const headers = parseCSVLine(lines[0])
    const trips = new Map<string, { route_id: string; shape_id: string }>()

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length < headers.length) continue

      const route_id = values[headers.indexOf('route_id')] || ''
      const shape_id = values[headers.indexOf('shape_id')] || ''

      if (route_id && shape_id && !trips.has(route_id)) {
        trips.set(route_id, { route_id, shape_id })
      }
    }

    tripsCache = trips
    return trips
  } catch (error) {
    console.error('Error loading trips:', error)
    return new Map()
  }
}

/**
 * Get transit stops for a city/region
 */
export async function getTransitStops(
  feedPath: string,
  bounds?: { north: number; south: number; east: number; west: number }
): Promise<TransitStop[]> {
  const stops = await loadStops(feedPath)
  const routes = await loadRoutes(feedPath)
  const trips = await loadTrips(feedPath)

  // Load stop_times to map stops to routes
  // Note: stop_times.txt can be very large (69MB+), so we use a streaming approach
  const stopToRoutes = new Map<string, Set<string>>()
  
  try {
    // For performance, we'll sample stop_times instead of loading the entire file
    // In production, you might want to pre-process this data server-side
    const response = await fetch(`/gtfs/${feedPath}/stop_times.txt`, {
      headers: {
        'Range': 'bytes=0-1000000' // Only load first 1MB for initial mapping
      }
    })
    
    if (!response.ok && response.status !== 206) {
      console.warn(`Could not load stop_times.txt: ${response.statusText}. Using alternative method.`)
      // Fallback: continue without stop_times mapping - stops will still be shown but without route info
    } else {
      const text = await response.text()
      const lines = text.split('\n').filter(line => line.trim()).slice(0, 5000) // Limit for performance
      
      if (lines.length > 0) {
        const headers = parseCSVLine(lines[0])
        const tripToRoute = new Map<string, string>()

        // First pass: map trips to routes
        for (let i = 1; i < Math.min(lines.length, 1000); i++) {
          const values = parseCSVLine(lines[i])
          if (values.length < headers.length) continue
          
          const trip_id = values[headers.indexOf('trip_id')] || ''
          if (trip_id && trips.has(trip_id)) {
            const trip = trips.get(trip_id)!
            tripToRoute.set(trip_id, trip.route_id)
          }
        }

        // Second pass: map stops to routes via trips
        for (let i = 1; i < Math.min(lines.length, 10000); i++) {
          const values = parseCSVLine(lines[i])
          if (values.length < headers.length) continue
          
          const trip_id = values[headers.indexOf('trip_id')] || ''
          const stop_id = values[headers.indexOf('stop_id')] || ''
          
          if (trip_id && stop_id && tripToRoute.has(trip_id)) {
            const route_id = tripToRoute.get(trip_id)!
            if (!stopToRoutes.has(stop_id)) {
              stopToRoutes.set(stop_id, new Set())
            }
            stopToRoutes.get(stop_id)!.add(route_id)
          }
        }
        
        console.log(`Loaded ${stopToRoutes.size} stops with route mappings (sampled from ${lines.length} lines)`)
      }
    }
  } catch (error) {
    console.error('Error loading stop_times:', error)
    // Continue without stop_times - stops will still be shown
  }

  const transitStops: TransitStop[] = []

  stops.forEach((stop, stopId) => {
    // Filter by bounds if provided
    if (bounds) {
      if (
        stop.stop_lat < bounds.south ||
        stop.stop_lat > bounds.north ||
        stop.stop_lon < bounds.west ||
        stop.stop_lon > bounds.east
      ) {
        return
      }
    }

    const routeIds = Array.from(stopToRoutes.get(stopId) || [])
    const routeNames = routeIds
      .map(id => routes.get(id))
      .filter(Boolean)
      .map(route => route!.route_short_name)
    
    const routeType = routeIds.length > 0 
      ? routes.get(routeIds[0])?.route_type || 3
      : 3

    transitStops.push({
      id: stop.stop_id,
      name: stop.stop_name,
      description: stop.stop_desc,
      latitude: stop.stop_lat,
      longitude: stop.stop_lon,
      routeIds,
      routeNames,
      routeType,
    })
  })

  return transitStops
}

/**
 * Get transit routes with shapes
 */
export async function getTransitRoutes(
  feedPath: string,
  routeIds?: string[]
): Promise<TransitRoute[]> {
  const routes = await loadRoutes(feedPath)
  const shapes = await loadShapes(feedPath)
  const trips = await loadTrips(feedPath)

  const transitRoutes: TransitRoute[] = []

  routes.forEach((route, routeId) => {
    if (routeIds && !routeIds.includes(routeId)) return

    const trip = trips.get(routeId)
    const shapeId = trip?.shape_id || ''
    const shapePoints = shapes.get(shapeId) || []

    const shape = shapePoints.map(point => ({
      lat: point.shape_pt_lat,
      lng: point.shape_pt_lon,
    }))

    transitRoutes.push({
      id: route.route_id,
      shortName: route.route_short_name,
      longName: route.route_long_name,
      type: route.route_type,
      color: `#${route.route_color}`,
      textColor: `#${route.route_text_color}`,
      shape,
      stops: [], // Will be populated separately if needed
    })
  })

  return transitRoutes
}

/**
 * Get feed path for a city
 */
export function getFeedPathForCity(cityName: string): string | null {
  const cityToFeed: Record<string, string> = {
    'București': 'BUCHAREST-REGION',
    'Bucharest': 'BUCHAREST-REGION',
    'Brașov': 'mdb-2143-202512160153',
    'Braşov': 'mdb-2143-202512160153',
    'Brasov': 'mdb-2143-202512160153',
    // Add more city mappings as needed
  }

  // Try exact match first
  if (cityToFeed[cityName]) {
    return cityToFeed[cityName]
  }

  // Try case-insensitive match
  const normalizedCityName = cityName.toLowerCase().trim()
  for (const [key, value] of Object.entries(cityToFeed)) {
    if (key.toLowerCase() === normalizedCityName) {
      return value
    }
  }

  return null
}

