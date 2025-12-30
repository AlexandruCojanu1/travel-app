/**
 * Service for calculating transit routes using GTFS data
 */

import { getTransitStops, getTransitRoutes, getFeedPathForCity } from './gtfs.service'
import type { TransitStop, TransitRoute } from './gtfs.service'

export interface TransitRouteSegment {
  from: { name: string; lat: number; lng: number }
  to: { name: string; lat: number; lng: number }
  route: TransitRoute | null
  stopFrom: TransitStop | null
  stopTo: TransitStop | null
  distance: number // meters
  duration: number // seconds (estimated)
  walkingDistance?: number // meters to/from stops
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

    // Estimate transit distance and duration
    const transitDistance = calculateDistance(
      fromStop.latitude,
      fromStop.longitude,
      toStop.latitude,
      toStop.longitude
    )
    
    // Estimate transit duration: average 20 km/h including stops
    const transitDuration = (transitDistance / (20 / 3.6)) // seconds
    // Add walking time: 5 km/h
    const walkDuration = ((walkToFromStop + walkFromToStop) / (5 / 3.6))
    const totalDuration = transitDuration + walkDuration

    const segments: TransitRouteSegment[] = []
    
    // Walking segment to first stop
    if (walkToFromStop > 0) {
      segments.push({
        from: { name: from.name || 'Start', lat: from.lat, lng: from.lng },
        to: { name: fromStop.name, lat: fromStop.latitude, lng: fromStop.longitude },
        route: null,
        stopFrom: null,
        stopTo: fromStop,
        distance: walkToFromStop,
        duration: walkToFromStop / (5 / 3.6), // walking speed
        walkingDistance: walkToFromStop,
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
      })
    }
    
    // Walking segment from last stop
    if (walkFromToStop > 0) {
      segments.push({
        from: { name: toStop.name, lat: toStop.latitude, lng: toStop.longitude },
        to: { name: to.name || 'Destination', lat: to.lat, lng: to.lng },
        route: null,
        stopFrom: toStop,
        stopTo: null,
        distance: walkFromToStop,
        duration: walkFromToStop / (5 / 3.6), // walking speed
        walkingDistance: walkFromToStop,
      })
    }

    return {
      segments,
      totalDistance: walkToFromStop + transitDistance + walkFromToStop,
      totalDuration,
      routes: route ? [route] : [],
    }
  } catch (error) {
    console.error('Error calculating transit route:', error)
    return null
  }
}

