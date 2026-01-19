"use client"

import React, { useMemo, useState, useEffect } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl'
import { useTripStore } from '@/store/trip-store'
import { getBusinessById } from '@/services/business/business.service'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'
// RouteOptimizer removed - not needed
// DirectionsButton removed
import { TransportCostsPanel } from './transport-costs-panel'
import { calculateOSRMRoute } from '@/services/map/routing.service'
import type { RoutePoint } from '@/services/map/routing.service'
import { useAppStore } from '@/store/app-store'
import type { Business } from '@/services/business/business.service'
import { cn } from '@/lib/utils'
import type { TransportMode } from '@/services/map/transport-costs.service'

interface RouteMapViewProps {
  dayIndex: number
  height?: string
}

export function RouteMapView({ dayIndex, height = '400px' }: RouteMapViewProps) {
  const { getItemsByDay, tripDetails, reorderItems } = useTripStore()
  const { currentCity } = useAppStore()
  const [businesses, setBusinesses] = React.useState<Business[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [transportMode, setTransportMode] = useState<TransportMode>('walking')
  const [routeGeometry, setRouteGeometry] = useState<number[][] | null>(null)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  interface TransitSegment {
    walkingDistance?: number
    [key: string]: unknown
  }

  const [transitInfo, setTransitInfo] = useState<{ routes: string[]; segments: TransitSegment[] } | null>(null)

  const items = getItemsByDay(dayIndex)

  // Memoize items IDs to prevent infinite loops
  const itemsIds = React.useMemo(() => items.map(i => i.id).join(','), [items])

  // Load business details for all items (including nature reserves and recreation areas)
  React.useEffect(() => {
    let cancelled = false

    async function loadBusinesses() {
      if (items.length === 0) {
        if (!cancelled) {
          setBusinesses([])
          setIsLoading(false)
        }
        return
      }

      if (!cancelled) {
        setIsLoading(true)
      }

      try {
        // All items (including nature reserves and recreation areas) are in businesses table
        const businessPromises = items.map(async (item) => {
          return getBusinessById(item.business_id)
        })

        const businessResults = await Promise.all(businessPromises)

        if (!cancelled) {
          const validBusinesses = businessResults.filter(
            (b): b is Business => b !== null && b.latitude !== null && b.longitude !== null
          )
          setBusinesses(validBusinesses)
          setIsLoading(false)
        }
      } catch (error) {
        logger.error('Error loading businesses for route', error, { dayIndex, itemsCount: items.length })
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadBusinesses()

    return () => {
      cancelled = true
    }
  }, [itemsIds, dayIndex, currentCity?.id])

  // Calculate center and bounds
  const { center, bounds } = useMemo(() => {
    if (businesses.length === 0) {
      return {
        center: tripDetails
          ? { lat: 45.6427, lng: 25.5887 } // Default to Brașov
          : { lat: 0, lng: 0 },
        bounds: null,
      }
    }

    const lats = businesses.map((b) => b.latitude!).filter((lat) => lat !== null)
    const lngs = businesses.map((b) => b.longitude!).filter((lng) => lng !== null)

    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    return {
      center: {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2,
      },
      bounds: {
        minLat,
        maxLat,
        minLng,
        maxLng,
      },
    }
  }, [businesses, tripDetails])

  // Handle route optimization
  const handleOptimized = (optimizedPoints: RoutePoint[]) => {
    // Map optimized points back to item IDs using name matching
    const optimizedIds = optimizedPoints
      .map(p => {
        // Find matching business by name
        const business = businesses.find(b => b.name === p.name)
        return business?.id
      })
      .filter((id): id is string => id !== undefined)

    if (optimizedIds.length === items.length) {
      // Reorder items in store
      reorderItems(dayIndex, optimizedIds)
    }
  }

  // Create route points for optimization
  const routePoints: RoutePoint[] = useMemo(() => {
    return businesses.map((b, idx) => ({
      latitude: b.latitude!,
      longitude: b.longitude!,
      name: b.name,
      id: b.id,
    }))
  }, [businesses])

  // Calculate real route when businesses or transport mode changes
  useEffect(() => {
    if (businesses.length < 2) {
      setRouteGeometry(null)
      setTransitInfo(null)
      return
    }

    setIsCalculatingRoute(true)

    async function calculateRoute() {
      try {
        const points: RoutePoint[] = businesses.map(b => ({
          latitude: b.latitude!,
          longitude: b.longitude!,
          name: b.name,
        }))

        // Use OSRM API for real road-based routing
        const routingMode = transportMode === 'walking' ? 'walking' : transportMode === 'car' || transportMode === 'taxi' ? 'driving' : 'driving'
        const routePoints: RoutePoint[] = points.map(p => ({
          latitude: p.latitude,
          longitude: p.longitude,
          name: p.name,
        }))

        const routeResult = await calculateOSRMRoute(routePoints, routingMode)

        if (routeResult && routeResult.geometry) {
          setRouteGeometry(routeResult.geometry)
        } else {
          // Fallback to straight line
          setRouteGeometry(points.map(p => [p.longitude, p.latitude]))
        }

        // For transit mode, show basic info
        if (transportMode === 'transit') {
          setTransitInfo({
            routes: [],
            segments: [],
          })
        } else {
          setTransitInfo(null)
        }
      } catch (error) {
        logger.error('Error calculating route', error, { transportMode, businessesCount: businesses.length })
        // Fallback to straight line
        const points: RoutePoint[] = businesses.map(b => ({
          latitude: b.latitude!,
          longitude: b.longitude!,
          name: b.name,
        }))
        setRouteGeometry(points.map(p => [p.longitude, p.latitude]))
        setTransitInfo(null)
      } finally {
        setIsCalculatingRoute(false)
      }
    }

    calculateRoute()
  }, [businesses, transportMode, currentCity?.name])

  // Handle user location
  const handleGetLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation nu este suportat de browser-ul tău')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        setIsLocating(false)
        toast.success('Locația a fost obținută cu succes')
      },
      (error) => {
        logger.error('Error getting location', error)
        toast.error('Nu am putut obține locația ta. Te rugăm să verifici permisiunile.')
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  // Calculate route from user location to first activity
  useEffect(() => {
    // Only calculate if we have user location and businesses
    // We check businesses.length > 0, but if all are visited, nextUnvisited might be undefined
    if (userLocation && businesses.length > 0) {
      const calculateRoute = async () => {
        // Find first unvisited business
        // We need to merge businesses with items to get visited status
        const mergedBusinesses = businesses.map(b => {
          const item = items.find(i => i.business_id === b.id)
          return { ...b, isVisited: !!item?.is_visited }
        })

        const nextUnvisited = mergedBusinesses.find(b => !b.isVisited)

        // Target points: User -> Next Unvisited
        const targetPoints: RoutePoint[] = [
          { latitude: userLocation.lat, longitude: userLocation.lng, name: 'Locația mea' },
          ...(nextUnvisited ? [{
            latitude: nextUnvisited.latitude!,
            longitude: nextUnvisited.longitude!,
            name: nextUnvisited.name,
          }] : [])
        ]

        // If no target unvisited business, route geometry is cleared (or could route to hotel/end)
        if (!nextUnvisited) {
          setRouteGeometry(null)
          setIsCalculatingRoute(false)
          return
        }

        setIsCalculatingRoute(true)
        const routingMode = transportMode === 'walking' ? 'walking' : 'driving'

        try {
          const routeResult = await calculateOSRMRoute(targetPoints, routingMode)
          if (routeResult && routeResult.geometry) {
            setRouteGeometry(routeResult.geometry)
          }
        } catch (error) {
          logger.error('Error calculating route from location', error, { userLocation, businessesCount: businesses.length })
        } finally {
          setIsCalculatingRoute(false)
        }
      }

      calculateRoute()
    }
  }, [userLocation, businesses, transportMode, items])

  // Create route line from calculated geometry
  const routeLine = useMemo(() => {
    if (!routeGeometry || routeGeometry.length < 2) return null

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: routeGeometry,
      },
      properties: {},
    }
  }, [routeGeometry])

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <div
        className="w-full bg-gray-100 rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-gray-500">Se încarcă ruta...</div>
      </div>
    )
  }

  if (businesses.length === 0) {
    return (
      <div
        className="w-full bg-gray-100 rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-gray-500 text-center">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Nu există locații adăugate pentru această zi</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {businesses.length >= 2 && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            {isCalculatingRoute && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Se calculează...</span>
              </div>
            )}
          </div>

          {/* Transit Info */}
          {transitInfo && transitInfo.routes.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Transport în comun:</h4>
              <div className="flex flex-wrap gap-2">
                {transitInfo.routes.map((routeName, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold"
                  >
                    Linia {routeName}
                  </span>
                ))}
              </div>
              <p className="text-xs text-blue-700 mt-2">
                {transitInfo.segments.filter(s => s.walkingDistance).length > 0 &&
                  'Include mers pe jos până la stație și de la stație'}
              </p>
            </div>
          )}

          {/* Transport Costs Panel */}
          {/* Transport Costs Panel - Pass only the Next Unvisited as destination */}
          <TransportCostsPanel
            points={(() => {
              const mergedBusinesses = businesses.map(b => {
                const item = items.find(i => i.business_id === b.id)
                return { ...b, isVisited: !!item?.is_visited }
              })
              const nextUnvisited = mergedBusinesses.find(b => !b.isVisited)
              return nextUnvisited ? [{
                latitude: nextUnvisited.latitude!,
                longitude: nextUnvisited.longitude!,
                name: nextUnvisited.name || '',
              }] : []
            })()}
          />
        </>
      )}

      <div className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ height }}>
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
          mapLib={import('maplibre-gl') as any}
          initialViewState={{
            latitude: center.lat,
            longitude: center.lng,
            zoom: bounds
              ? Math.max(
                10,
                Math.min(
                  16,
                  12 - Math.log(Math.max(bounds.maxLat - bounds.minLat, bounds.maxLng - bounds.minLng))
                )
              )
              : 12,
          }}
          style={{ width: '100%', height: '100%' }}
          interactive={true}
        >
          {/* Route Line */}
          {routeLine && (
            <Source id="route-line" type="geojson" data={routeLine}>
              <Layer
                id="route-line-layer"
                type="line"
                paint={{
                  'line-color': '#3b82f6',
                  'line-width': 4,
                  'line-opacity': 0.8,
                }}
              />
            </Source>
          )}

          {/* User Location Marker */}
          {userLocation && (
            <Marker
              latitude={userLocation.lat}
              longitude={userLocation.lng}
              anchor="bottom"
            >
              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center z-10">
                  <div className="absolute inset-0 w-full h-full bg-blue-500 rounded-full animate-ping opacity-20" />
                  <div className="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-blue-600 -mt-0.5" />
              </div>
            </Marker>
          )}

          {/* Business Markers */}
          {businesses.map((business, index) => {
            const item = items.find(i => i.business_id === business.id)
            const isVisited = !!item?.is_visited
            // Highlight next unvisited
            // const isNext = ... logic if needed
            const isGray = isVisited

            return (
              <Marker
                key={business.id}
                latitude={business.latitude!}
                longitude={business.longitude!}
                anchor="bottom"
              >
                <div className="flex flex-col items-center group cursor-pointer" style={{ opacity: isVisited ? 0.6 : 1 }}>
                  <div className={cn(
                    "rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white z-10 transition-transform group-hover:scale-110",
                    isVisited ? "bg-slate-500 text-white" : "bg-blue-600 text-white"
                  )}>
                    {index + 1}
                  </div>
                  <div className={cn(
                    "w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent -mt-0.5",
                    isVisited ? "border-t-slate-500" : "border-t-blue-600"
                  )} />
                </div>
              </Marker>
            )
          })}
        </Map>
      </div>
    </div>
  )
}

