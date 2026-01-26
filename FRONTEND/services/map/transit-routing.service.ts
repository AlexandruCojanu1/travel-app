/**
 * Service for calculating transit routes using GTFS data
 */

import { getTransitStops, getTransitRoutes, getFeedPathForCity } from './gtfs.service'
import type { TransitStop, TransitRoute } from './gtfs.service'
import { getStopSchedule } from './gtfs-schedule.service'
import { calculateRealRoute } from './osrm-routing.service'

export interface TransitRouteSegment {
  from: { name: string; lat: number; lng: number }
  to: { name: string; lat: number; lng: number }
  route: TransitRoute | null
  stopFrom: TransitStop | null
  stopTo: TransitStop | null
  distance: number // meters
  duration: number // seconds (estimated)
  walkingDistance?: number // meters to/from stops
  schedule?: Array<{ arrivalTime: string; departureTime: string }> // Real schedule times
  routeShape?: Array<{ lat: number; lng: number }> // GTFS shape for route display
}

export interface TransitRouteResult {
  segments: TransitRouteSegment[]
  totalDistance: number // meters
  totalDuration: number // seconds
  routes: TransitRoute[] // unique routes used
}

/**
 * Find nearest transit stop to a point
 */
function findNearestStop(
  point: { lat: number; lng: number },
  stops: TransitStop[],
  maxDistance: number = 500 // meters
): TransitStop | null {
  let nearest: TransitStop | null = null
  let minDistance = maxDistance

  for (const stop of stops) {
    const distance = calculateDistance(point.lat, point.lng, stop.latitude, stop.longitude)
    if (distance < minDistance) {
      minDistance = distance
      nearest = stop
    }
  }

  return nearest
}

/**
 * Calculate distance between two points (Haversine)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
 * Find route that connects two stops
 */
function findConnectingRoute(
  fromStop: TransitStop,
  toStop: TransitStop,
  routes: TransitRoute[]
): TransitRoute | null {
  // Find routes that serve both stops
  for (const route of routes) {
    // Check if route serves both stops (simplified - in reality would check route shape)
    const fromServes = fromStop.routeNames.some(name => 
      route.shortName === name || route.longName?.includes(name)
    )
    const toServes = toStop.routeNames.some(name => 
      route.shortName === name || route.longName?.includes(name)
    )
    
    if (fromServes && toServes) {
      return route
    }
  }

  return null
}

/**
 * Calculate transit route between two points
 */
export async function calculateTransitRoute(
  from: { lat: number; lng: number; name?: string },
  to: { lat: number; lng: number; name?: string },
  cityName?: string
): Promise<TransitRouteResult | null> {
  if (!cityName) {
    return null
  }

  try {
    const feedPath = getFeedPathForCity(cityName)
    if (!feedPath) {
      return null
    }

    // Get transit stops and routes
    const bounds = {
      north: Math.max(from.lat, to.lat) + 0.05,
      south: Math.min(from.lat, to.lat) - 0.05,
      east: Math.max(from.lng, to.lng) + 0.05,
      west: Math.min(from.lng, to.lng) - 0.05,
    }

    const stops = await getTransitStops(feedPath, bounds)
    const routes = await getTransitRoutes(feedPath)

    if (stops.length === 0) {
      return null
    }

    // Find nearest stops
    const fromStop = findNearestStop(from, stops, 1000) // 1km max
    const toStop = findNearestStop(to, stops, 1000)

    if (!fromStop || !toStop) {
      return null
    }

    // Calculate walking distances to/from stops
    const walkToFromStop = calculateDistance(from.lat, from.lng, fromStop.latitude, fromStop.longitude)
    const walkFromToStop = calculateDistance(toStop.latitude, toStop.longitude, to.lat, to.lng)

    // Find connecting route
    const route = findConnectingRoute(fromStop, toStop, routes)

    // Use route shape if available, otherwise calculate distance
    let transitDistance = 0
    let routeShape: Array<{ lat: number; lng: number }> | undefined = undefined
    
    if (route && route.shape && route.shape.length > 0) {
      // Use actual route shape for distance calculation
      routeShape = route.shape
      
      // Calculate distance along route shape
      for (let i = 0; i < route.shape.length - 1; i++) {
        transitDistance += calculateDistance(
          route.shape[i].lat,
          route.shape[i].lng,
          route.shape[i + 1].lat,
          route.shape[i + 1].lng
        )
      }
    } else {
      // Fallback: straight line distance
      transitDistance = calculateDistance(
        fromStop.latitude,
        fromStop.longitude,
        toStop.latitude,
        toStop.longitude
      )
    }
    
    // Estimate transit duration: average 25 km/h including stops (more realistic)
    const transitDuration = (transitDistance / (25 / 3.6)) // seconds
    // Add walking time: 5 km/h
    const walkDuration = ((walkToFromStop + walkFromToStop) / (5 / 3.6))
    const totalDuration = transitDuration + walkDuration

    // Get real schedule times for the stop
    let schedule: Array<{ arrivalTime: string; departureTime: string }> | undefined = undefined
    if (route && fromStop.id) {
      try {
        const stopSchedule = await getStopSchedule(fromStop.id, route.id, cityName)
        schedule = stopSchedule.map(s => ({
          arrivalTime: s.arrivalTime,
          departureTime: s.departureTime,
        }))
      } catch (error) {
        console.warn('Could not load schedule:', error)
      }
    }

    const segments: TransitRouteSegment[] = []
    
    // Walking segment to first stop - use OSRM for real walking route
    if (walkToFromStop > 0) {
      let walkingRouteGeometry: Array<{ lat: number; lng: number }> | undefined = undefined
      let walkingDuration = walkToFromStop / (5 / 3.6) // fallback duration
      let actualDistance = walkToFromStop
      
      try {
        const walkingRoute = await calculateRealRoute(
          [
            { latitude: from.lat, longitude: from.lng, name: from.name || 'Start' },
            { latitude: fromStop.latitude, longitude: fromStop.longitude, name: fromStop.name },
          ],
          'walking'
        )
        
        if (walkingRoute && walkingRoute.segments.length > 0) {
          const segment = walkingRoute.segments[0]
          walkingDuration = segment.duration // seconds
          actualDistance = segment.distance // meters
          if (walkingRoute.geometry && walkingRoute.geometry.coordinates) {
            walkingRouteGeometry = walkingRoute.geometry.coordinates.map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }))
          }
        }
      } catch (error) {
        console.warn('Error calculating walking route to stop:', error)
      }
      
      segments.push({
        from: { name: from.name || 'Start', lat: from.lat, lng: from.lng },
        to: { name: fromStop.name, lat: fromStop.latitude, lng: fromStop.longitude },
        route: null,
        stopFrom: null,
        stopTo: fromStop,
        distance: actualDistance,
        duration: walkingDuration,
        walkingDistance: actualDistance,
        routeShape: walkingRouteGeometry, // Real walking route geometry
      })
    }
    
    // Transit segment
    if (transitDistance > 0) {
      segments.push({
        from: { name: fromStop.name, lat: fromStop.latitude, lng: fromStop.longitude },
        to: { name: toStop.name, lat: toStop.latitude, lng: toStop.longitude },
        route,
        stopFrom: fromStop,
        stopTo: toStop,
        distance: transitDistance,
        duration: transitDuration,
        schedule,
        routeShape,
      })
    }
    
    // Walking segment from last stop - use OSRM for real walking route
    if (walkFromToStop > 0) {
      let walkingRouteGeometry: Array<{ lat: number; lng: number }> | undefined = undefined
      let walkingDuration = walkFromToStop / (5 / 3.6) // fallback duration
      let actualDistance = walkFromToStop
      
      try {
        const walkingRoute = await calculateRealRoute(
          [
            { latitude: toStop.latitude, longitude: toStop.longitude, name: toStop.name },
            { latitude: to.lat, longitude: to.lng, name: to.name || 'Destination' },
          ],
          'walking'
        )
        
        if (walkingRoute && walkingRoute.segments.length > 0) {
          const segment = walkingRoute.segments[0]
          walkingDuration = segment.duration // seconds
          actualDistance = segment.distance // meters
          if (walkingRoute.geometry && walkingRoute.geometry.coordinates) {
            walkingRouteGeometry = walkingRoute.geometry.coordinates.map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }))
          }
        }
      } catch (error) {
        console.warn('Error calculating walking route from stop:', error)
      }
      
      segments.push({
        from: { name: toStop.name, lat: toStop.latitude, lng: toStop.longitude },
        to: { name: to.name || 'Destination', lat: to.lat, lng: to.lng },
        route: null,
        stopFrom: toStop,
        stopTo: null,
        distance: actualDistance,
        duration: walkingDuration,
        walkingDistance: actualDistance,
        routeShape: walkingRouteGeometry, // Real walking route geometry
      })
    }

    // Recalculate total distance from actual segment distances
    const totalActualDistance = segments.reduce((sum, seg) => sum + seg.distance, 0)
    
    return {
      segments,
      totalDistance: totalActualDistance,
      totalDuration,
      routes: route ? [route] : [],
    }
  } catch (error) {
    console.error('Error calculating transit route:', error)
    return null
  }
}

