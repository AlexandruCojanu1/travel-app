/**
 * Map & Routing Types
 * These types can be safely imported in Client Components
 */

export interface RoutePoint {
  latitude: number
  longitude: number
  name: string
  type?: 'start' | 'waypoint' | 'end'
  businessId?: string
}

export interface RouteSegment {
  from: RoutePoint
  to: RoutePoint
  distance: number // in meters
  duration: number // in seconds
  mode: 'walking' | 'driving' | 'transit'
}

export interface Route {
  points: RoutePoint[]
  segments: RouteSegment[]
  totalDistance: number
  totalDuration: number
}
