"use client"

import React, { useMemo, useState, useEffect } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl'
import { useTripStore } from '@/store/trip-store'
import { getBusinessById } from '@/services/business/business.service'
import { getBrasovNatureReserves, getBrasovRecreationAreas } from '@/services/nature/nature-reserves.service'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { RouteOptimizer } from '@/components/features/map/route-optimizer'
import { DirectionsButton } from '@/components/features/map/directions-button'
import { TransportCostsPanel } from './transport-costs-panel'
import { calculateRealRoute } from '@/services/map/routing.service'
import type { RoutePoint } from '@/services/map/routing.service'
import { useAppStore } from '@/store/app-store'
import type { Business } from '@/services/business/business.service'
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
  const [transitInfo, setTransitInfo] = useState<{ routes: string[]; segments: any[] } | null>(null)

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
        // Load hardcoded nature reserves and recreation areas
        const natureReserves = getBrasovNatureReserves()
        const recreationAreas = getBrasovRecreationAreas()
        
        const businessPromises = items.map(async (item) => {
          // Check if it's a nature reserve
          if (item.business_id.startsWith('nature-')) {
            const reserveName = item.business_id.replace('nature-', '').replace(/-/g, ' ').toLowerCase().trim()
            const reserve = natureReserves.find((r) => {
              const rName = r.name.toLowerCase().trim()
              // Flexible matching: exact match or contains
              return rName === reserveName || 
                     rName.includes(reserveName) || 
                     reserveName.includes(rName)
            })
            if (reserve) {
              return {
                id: item.business_id,
                name: reserve.name,
                category: 'Nature',
                latitude: reserve.latitude,
                longitude: reserve.longitude,
                description: reserve.description,
                address: null,
                image_url: null,
                rating: null,
                is_verified: false,
                city_id: '',
                created_at: '',
                updated_at: '',
              } as Business
            }
          }
          
          // Check if it's a recreation area
          if (item.business_id.startsWith('recreation-')) {
            const areaName = item.business_id.replace('recreation-', '').replace(/-/g, ' ').toLowerCase().trim()
            const area = recreationAreas.find((a) => {
              const aName = a.name.toLowerCase().trim()
              // Flexible matching: exact match or contains
              return aName === areaName || 
                     aName.includes(areaName) || 
                     areaName.includes(aName)
            })
            if (area) {
              return {
                id: item.business_id,
                name: area.name,
                category: 'Activities',
                latitude: area.latitude,
                longitude: area.longitude,
                description: area.description,
                address: null,
                image_url: null,
                rating: null,
                is_verified: false,
                city_id: '',
                created_at: '',
                updated_at: '',
              } as Business
            }
          }
          
          // Regular business
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
        console.error('Error loading businesses for route:', error)
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadBusinesses()
    
    return () => {
      cancelled = true
    }
  }, [itemsIds, dayIndex])

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

        // Use local routing (no Docker, no external services)
        const routingMode = transportMode === 'walking' ? 'walking' : transportMode === 'car' ? 'driving' : 'driving'
        const routePoints: RoutePoint[] = points.map(p => ({
          latitude: p.latitude,
          longitude: p.longitude,
          name: p.name,
        }))
        
        const routeResult = calculateRealRoute(routePoints, routingMode)
        
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
        console.error('Error calculating route:', error)
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
      alert('Geolocation nu este suportat de browser-ul tău')
      return
    }
    
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        setIsLocating(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Nu am putut obține locația ta. Te rugăm să verifici permisiunile.')
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
    if (userLocation && businesses.length > 0) {
      // Recalculate route with user location as start
      const points: RoutePoint[] = [
        { latitude: userLocation.lat, longitude: userLocation.lng, name: 'Locația mea' },
        ...businesses.map(b => ({
          latitude: b.latitude!,
          longitude: b.longitude!,
          name: b.name,
        })),
      ]

      setIsCalculatingRoute(true)
      const routingMode = transportMode === 'walking' ? 'walking' : 'driving'
      const routePoints: RoutePoint[] = points.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude,
        name: p.name,
      }))
      
      try {
        const routeResult = calculateRealRoute(routePoints, routingMode)
        if (routeResult && routeResult.geometry) {
          setRouteGeometry(routeResult.geometry)
        }
      } catch (error) {
        console.error('Error calculating route from location:', error)
      } finally {
        setIsCalculatingRoute(false)
      }
    }
  }, [userLocation, businesses, transportMode])

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
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <RouteOptimizer
                points={routePoints}
                onOptimized={handleOptimized}
              />
              <DirectionsButton points={routePoints} />
              <button
                onClick={handleGetLocation}
                disabled={isLocating}
                className="px-4 py-2 rounded-lg font-semibold text-sm transition-all border-2 bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50 flex items-center gap-2 disabled:opacity-50"
              >
                {isLocating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                <span>Locația mea</span>
              </button>
            </div>
            {isCalculatingRoute && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Se calculează ruta...</span>
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
          <TransportCostsPanel
            points={routePoints}
            selectedMode={transportMode}
            onModeChange={setTransportMode}
            cityName={currentCity?.name}
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
            anchor="center"
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full opacity-20 animate-ping" />
              </div>
              <div className="relative flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
                <div className="absolute top-7 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-blue-600" />
              </div>
            </div>
          </Marker>
        )}

        {/* Business Markers */}
        {businesses.map((business, index) => (
          <Marker
            key={business.id}
            latitude={business.latitude!}
            longitude={business.longitude!}
            anchor="center"
          >
            <div className="relative">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white">
                {userLocation ? index + 1 : index + 1}
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600" />
              </div>
            </div>
          </Marker>
        ))}
        </Map>
      </div>
    </div>
  )
}

