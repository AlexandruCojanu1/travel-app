/**
 * Service for getting transit schedule times from GTFS
 */

import { getFeedPathForCity } from './gtfs.service'

export interface StopTime {
  trip_id: string
  arrival_time: string // HH:MM:SS format
  departure_time: string // HH:MM:SS format
  stop_id: string
  stop_sequence: number
}

export interface TransitSchedule {
  routeName: string
  stopName: string
  arrivalTime: string // HH:MM format
  departureTime: string // HH:MM format
}

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
 * Get schedule times for a specific stop and route
 */
export async function getStopSchedule(
  stopId: string,
  routeId: string,
  cityName: string
): Promise<TransitSchedule[]> {
  const feedPath = getFeedPathForCity(cityName)
  if (!feedPath) {
    return []
  }

  try {
    // Load trips to get trip_ids for this route
    const tripsResponse = await fetch(`/gtfs/${feedPath}/trips.txt`)
    if (!tripsResponse.ok) return []

    const tripsText = await tripsResponse.text()
    const tripsLines = tripsText.split('\n').filter(line => line.trim())
    if (tripsLines.length === 0) return []

    const tripsHeaders = parseCSVLine(tripsLines[0])
    const routeTrips = new Set<string>()

    for (let i = 1; i < tripsLines.length; i++) {
      const values = parseCSVLine(tripsLines[i])
      if (values.length < tripsHeaders.length) continue

      const tripRouteId = values[tripsHeaders.indexOf('route_id')] || ''
      if (tripRouteId === routeId) {
        const tripId = values[tripsHeaders.indexOf('trip_id')] || ''
        if (tripId) {
          routeTrips.add(tripId)
        }
      }
    }

    if (routeTrips.size === 0) return []

    // Load stop_times to get schedule
    const stopTimesResponse = await fetch(`/gtfs/${feedPath}/stop_times.txt`)
    if (!stopTimesResponse.ok) return []

    const stopTimesText = await stopTimesResponse.text()
    const stopTimesLines = stopTimesText.split('\n').filter(line => line.trim())
    if (stopTimesLines.length === 0) return []

    const stopTimesHeaders = parseCSVLine(stopTimesLines[0])
    const schedules: TransitSchedule[] = []

    // Load routes for route name
    const routesResponse = await fetch(`/gtfs/${feedPath}/routes.txt`)
    let routeName = routeId
    if (routesResponse.ok) {
      const routesText = await routesResponse.text()
      const routesLines = routesText.split('\n').filter(line => line.trim())
      if (routesLines.length > 0) {
        const routesHeaders = parseCSVLine(routesLines[0])
        for (let i = 1; i < routesLines.length; i++) {
          const values = parseCSVLine(routesLines[i])
          if (values.length < routesHeaders.length) continue
          const rId = values[routesHeaders.indexOf('route_id')] || ''
          if (rId === routeId) {
            routeName = values[routesHeaders.indexOf('route_short_name')] || 
                       values[routesHeaders.indexOf('route_long_name')] || routeId
            break
          }
        }
      }
    }

    // Load stops for stop name
    const stopsResponse = await fetch(`/gtfs/${feedPath}/stops.txt`)
    let stopName = stopId
    if (stopsResponse.ok) {
      const stopsText = await stopsResponse.text()
      const stopsLines = stopsText.split('\n').filter(line => line.trim())
      if (stopsLines.length > 0) {
        const stopsHeaders = parseCSVLine(stopsLines[0])
        for (let i = 1; i < stopsLines.length; i++) {
          const values = parseCSVLine(stopsLines[i])
          if (values.length < stopsHeaders.length) continue
          const sId = values[stopsHeaders.indexOf('stop_id')] || ''
          if (sId === stopId) {
            stopName = values[stopsHeaders.indexOf('stop_name')] || stopId
            break
          }
        }
      }
    }

    // Find matching stop_times
    for (let i = 1; i < Math.min(stopTimesLines.length, 10000); i++) {
      const values = parseCSVLine(stopTimesLines[i])
      if (values.length < stopTimesHeaders.length) continue

      const tripId = values[stopTimesHeaders.indexOf('trip_id')] || ''
      const sId = values[stopTimesHeaders.indexOf('stop_id')] || ''
      const arrivalTime = values[stopTimesHeaders.indexOf('arrival_time')] || ''
      const departureTime = values[stopTimesHeaders.indexOf('departure_time')] || ''

      if (routeTrips.has(tripId) && sId === stopId && arrivalTime) {
        // Convert HH:MM:SS to HH:MM
        const arrival = arrivalTime.substring(0, 5)
        const departure = departureTime ? departureTime.substring(0, 5) : arrival

        schedules.push({
          routeName,
          stopName,
          arrivalTime: arrival,
          departureTime: departure,
        })
      }
    }

    // Sort by time and limit to next 5 departures
    schedules.sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime))
    return schedules.slice(0, 5)
  } catch (error) {
    console.error('Error loading transit schedule:', error)
    return []
  }
}

