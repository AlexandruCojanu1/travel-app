"use client"

import React, { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react'
import Map, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import Supercluster from 'supercluster'
import 'maplibre-gl/dist/maplibre-gl.css'
import { PriceMarker } from './price-marker'
import { ClusterMarker } from './cluster-marker'
import { TransitStopMarker } from './transit-stop-marker'
import { TransitRouteLayer } from './transit-route-layer'
import type { MapBusiness } from '@/services/business/business.service'
import type { TransitStop, TransitRoute } from '@/services/map/gtfs.service'
import { getTransitStops, getTransitRoutes, getFeedPathForCity } from '@/services/map/gtfs.service'

interface MapViewProps {
  businesses: MapBusiness[]
  initialLatitude: number
  initialLongitude: number
  initialZoom?: number
  bottomNavHeight?: number
  onBusinessSelect: (business: MapBusiness | null) => void
  selectedBusinessId: string | null
  onNatureReserveSelect?: (reserve: {
    name: string
    latitude: number
    longitude: number
    description: string
    area_hectares: number
    iucn_category: string
    reserve_type: string
  } | null) => void
  onRecreationAreaSelect?: (area: {
    name: string
    latitude: number
    longitude: number
    description: string
    category: string
  } | null) => void
  onMapMove?: (bounds: { north: number; south: number; east: number; west: number }) => void
  cityName?: string
  showTransit?: boolean
  userLocation?: { lat: number; lng: number } | null
  natureReserves?: Array<{
    name: string
    latitude: number
    longitude: number
    description: string
    area_hectares: number
    iucn_category: string
    reserve_type: string
  }>
  recreationAreas?: Array<{
    name: string
    latitude: number
    longitude: number
    description: string
    category: string
  }>
  showNavigationControls?: boolean
}

type ClusterFeature = {
  type: 'Feature'
  properties: {
    cluster: true
    cluster_id: number
    point_count: number
  }
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

type PointFeature = {
  type: 'Feature'
  properties: {
    cluster: false
    business: MapBusiness
  }
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

export interface MapViewRef {
  centerToLocation: (lat: number, lng: number) => void
}

export const MapView = forwardRef<MapViewRef, MapViewProps>(({
  businesses,
  initialLatitude,
  initialLongitude,
  initialZoom = 12,
  bottomNavHeight = 80,
  onBusinessSelect,
  selectedBusinessId,
  onMapMove,
  cityName,
  showTransit = false,
  userLocation = null,
  natureReserves = [],
  recreationAreas = [],
  onNatureReserveSelect,
  onRecreationAreaSelect,
  showNavigationControls = true,
}, ref) => {
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState({
    latitude: initialLatitude,
    longitude: initialLongitude,
    zoom: initialZoom,
  })

  // Expose centerToLocation function to parent via ref
  useImperativeHandle(ref, () => ({
    centerToLocation: (lat: number, lng: number) => {
      setViewState({
        latitude: lat,
        longitude: lng,
        zoom: 15, // Zoom closer for user location
      })
      // Also use flyTo for smooth animation
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1000,
      })
    },
  }))
  const [transitStops, setTransitStops] = useState<TransitStop[]>([])
  const [transitRoutes, setTransitRoutes] = useState<TransitRoute[]>([])
  const [selectedStop, setSelectedStop] = useState<TransitStop | null>(null)
  const [isLoadingTransit, setIsLoadingTransit] = useState(false)

  // Initialize supercluster
  const supercluster = useMemo(() => {
    const cluster = new Supercluster<{ business: MapBusiness }>({
      radius: 60,
      maxZoom: 16,
    })

    // Convert businesses to GeoJSON points - filter out invalid coordinates
    const points: PointFeature[] = businesses
      .filter((business) => {
        // Validate coordinates
        const isValid =
          business.latitude != null &&
          business.longitude != null &&
          !isNaN(business.latitude) &&
          !isNaN(business.longitude) &&
          business.latitude >= -90 && business.latitude <= 90 &&
          business.longitude >= -180 && business.longitude <= 180

        if (!isValid) {
          // Invalid coordinates filtered out silently
        }
        return isValid
      })
      .map((business) => ({
        type: 'Feature',
        properties: {
          cluster: false,
          business,
        },
        geometry: {
          type: 'Point',
          coordinates: [business.longitude, business.latitude],
        },
      }))

    // Loaded business markers
    cluster.load(points)
    return cluster
  }, [businesses])

  // Get clusters for current map bounds and zoom
  const { clusters, bounds } = useMemo(() => {
    const map = mapRef.current

    // Use viewState for initial bounds if map is not ready
    let boundsArray: [number, number, number, number]

    try {
      if (map) {
        const mapBounds = map.getMap().getBounds()
        boundsArray = [
          mapBounds.getWest(),
          mapBounds.getSouth(),
          mapBounds.getEast(),
          mapBounds.getNorth(),
        ]
      } else {
        // Fallback to viewState-based bounds when map is not initialized
        const latRange = 0.1 // ~11km
        const lngRange = 0.1
        boundsArray = [
          viewState.longitude - lngRange,
          viewState.latitude - latRange,
          viewState.longitude + lngRange,
          viewState.latitude + latRange,
        ]
      }

      const clusters = supercluster.getClusters(boundsArray, Math.floor(viewState.zoom))
      // Generated clusters/markers

      return {
        clusters,
        bounds: {
          west: boundsArray[0],
          south: boundsArray[1],
          east: boundsArray[2],
          north: boundsArray[3],
        },
      }
    } catch (error) {
      // Error calculating clusters - handled silently
      // Fallback to viewState-based bounds
      const latRange = 0.1
      const lngRange = 0.1
      const fallbackBounds: [number, number, number, number] = [
        viewState.longitude - lngRange,
        viewState.latitude - latRange,
        viewState.longitude + lngRange,
        viewState.latitude + latRange,
      ]
      return {
        clusters: supercluster.getClusters(fallbackBounds, Math.floor(viewState.zoom)),
        bounds: {
          west: fallbackBounds[0],
          south: fallbackBounds[1],
          east: fallbackBounds[2],
          north: fallbackBounds[3],
        },
      }
    }
  }, [supercluster, viewState])

  // Notify parent about map bounds changes
  useEffect(() => {
    if (bounds && onMapMove) {
      onMapMove(bounds)
    }
  }, [bounds, onMapMove])

  // Load transit data when enabled and city is available
  useEffect(() => {
    if (!showTransit || !cityName) {
      setTransitStops([])
      setTransitRoutes([])
      return
    }

    const loadTransitData = async () => {
      setIsLoadingTransit(true)
      try {
        const feedPath = getFeedPathForCity(cityName)
        if (!feedPath) {
          // No GTFS feed found for city
          setIsLoadingTransit(false)
          return
        }

        // Loading transit data

        // Use bounds if available, otherwise use initial viewport bounds
        const loadBounds = bounds || {
          west: viewState.longitude - 0.1,
          east: viewState.longitude + 0.1,
          south: viewState.latitude - 0.1,
          north: viewState.latitude + 0.1,
        }

        // Load stops within current map bounds
        const stops = await getTransitStops(feedPath, loadBounds)
        // Loaded transit stops
        setTransitStops(stops)

        // Load routes (limit to first 50 for performance)
        const allRoutes = await getTransitRoutes(feedPath)
        // Loaded transit routes
        setTransitRoutes(allRoutes.slice(0, 50))
      } catch (error) {
        // Error loading transit data - handled silently
      } finally {
        setIsLoadingTransit(false)
      }
    }

    // Small delay to ensure map is ready
    const timer = setTimeout(() => {
      loadTransitData()
    }, 500)

    return () => clearTimeout(timer)
  }, [showTransit, cityName, bounds, viewState])

  const handleClusterClick = (clusterId: number, longitude: number, latitude: number) => {
    const zoom = supercluster.getClusterExpansionZoom(clusterId)
    setViewState({
      latitude,
      longitude,
      zoom: Math.min(zoom, 20),
    })
  }

  const handleMarkerClick = (business: MapBusiness) => {
    onBusinessSelect(business)
  }

  const handleMapClick = (event: any) => {
    // Only close drawer if clicking on the map itself (not on markers)
    if (!event.originalEvent.defaultPrevented) {
      onBusinessSelect(null)
    }
  }

  return (
    <div
      className="relative w-full"
      style={{ height: `calc(100vh - ${bottomNavHeight}px)` }}
    >
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={{
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm-tiles-layer',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        }}
        mapLib={import('maplibre-gl') as any}
        style={{ width: '100%', height: '100%' }}
        maxZoom={19}
        minZoom={3}
        attributionControl={false}
      >
        {/* Render clusters and individual markers */}
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates

          // Check if it's a cluster or individual point
          if ('cluster' in cluster.properties && cluster.properties.cluster) {
            const clusterFeature = cluster as unknown as ClusterFeature
            return (
              <Marker
                key={`cluster-${clusterFeature.properties.cluster_id}`}
                latitude={latitude}
                longitude={longitude}
                anchor="center"
              >
                <ClusterMarker
                  count={clusterFeature.properties.point_count}
                  onClick={() =>
                    handleClusterClick(
                      clusterFeature.properties.cluster_id,
                      longitude,
                      latitude
                    )
                  }
                />
              </Marker>
            )
          }

          // Individual business marker
          const pointFeature = cluster as PointFeature
          const business = pointFeature.properties.business
          return (
            <Marker
              key={`business-${business.id}`}
              latitude={latitude}
              longitude={longitude}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.preventDefault()
                handleMarkerClick(business)
              }}
            >
              <PriceMarker
                price={business.price_level}
                category={business.category}
                isSelected={selectedBusinessId === business.id}
                onClick={() => handleMarkerClick(business)}
              />
            </Marker>
          )
        })}

        {/* Transit Routes */}
        {showTransit && <TransitRouteLayer routes={transitRoutes} visible={showTransit} />}

        {/* Transit Stops */}
        {showTransit && transitStops.map((stop) => (
          <Marker
            key={`transit-stop-${stop.id}`}
            latitude={stop.latitude}
            longitude={stop.longitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.preventDefault()
              setSelectedStop(selectedStop?.id === stop.id ? null : stop)
            }}
          >
            <TransitStopMarker
              name={stop.name}
              routeNames={stop.routeNames}
              routeType={stop.routeType}
              isSelected={selectedStop?.id === stop.id}
              onClick={() => setSelectedStop(selectedStop?.id === stop.id ? null : stop)}
            />
          </Marker>
        ))}

        {/* Nature Reserves Markers */}
        {natureReserves.map((reserve) => (
          <Marker
            key={`nature-reserve-${reserve.name}`}
            latitude={reserve.latitude}
            longitude={reserve.longitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.preventDefault()
              if (onNatureReserveSelect) {
                onNatureReserveSelect(reserve)
              }
            }}
          >
            <div className="relative group">
              {/* Main marker */}
              <div className="relative flex items-center justify-center cursor-pointer">
                <div className="w-10 h-10 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                {/* Pin point */}
                <div className="absolute top-9 w-0 h-0 border-l-5 border-r-5 border-t-8 border-l-transparent border-r-transparent border-t-primary" />
              </div>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="bg-white rounded-lg shadow-xl p-3 border-2 border-primary/20 min-w-[200px] max-w-[250px]">
                  <h3 className="font-bold text-primary text-sm mb-1">{reserve.name}</h3>
                  <p className="text-xs text-gray-600 mb-1">{reserve.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{reserve.area_hectares} ha</span>
                    <span>•</span>
                    <span>IUCN {reserve.iucn_category}</span>
                  </div>
                </div>
              </div>
            </div>
          </Marker>
        ))}

        {/* Recreation Areas Markers */}
        {recreationAreas.map((area) => (
          <Marker
            key={`recreation-area-${area.name}`}
            latitude={area.latitude}
            longitude={area.longitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.preventDefault()
              if (onRecreationAreaSelect) {
                onRecreationAreaSelect(area)
              }
            }}
          >
            <div className="relative group">
              {/* Main marker */}
              <div className="relative flex items-center justify-center cursor-pointer">
                <div className="w-10 h-10 bg-secondary rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                {/* Pin point */}
                <div className="absolute top-9 w-0 h-0 border-l-5 border-r-5 border-t-8 border-l-transparent border-r-transparent border-t-secondary" />
              </div>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="bg-white rounded-lg shadow-xl p-3 border-2 border-secondary/20 min-w-[200px] max-w-[250px]">
                  <h3 className="font-bold text-secondary text-sm mb-1">{area.name}</h3>
                  <p className="text-xs text-gray-600">{area.description}</p>
                </div>
              </div>
            </div>
          </Marker>
        ))}

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            latitude={userLocation.lat}
            longitude={userLocation.lng}
            anchor="center"
          >
            <div className="relative">
              {/* Pulse animation circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-primary rounded-full opacity-20 animate-ping" />
              </div>
              {/* Main pin */}
              <div className="relative flex items-center justify-center">
                <div className="w-8 h-8 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
                {/* Pin point */}
                <div className="absolute top-7 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-primary" />
              </div>
            </div>
          </Marker>
        )}

        {/* Map Controls - Must be direct children of Map component */}
        {showNavigationControls && <NavigationControl position="top-right" showCompass={false} />}



        {/* Transit Stop Info Popup */}
        {showTransit && selectedStop && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-white rounded-xl shadow-xl p-4 max-w-xs border-2 border-secondary/20">
              <h3 className="font-semibold text-slate-900 mb-1">{selectedStop.name}</h3>
              {selectedStop.description && (
                <p className="text-xs text-slate-600 mb-2">{selectedStop.description}</p>
              )}
              {selectedStop.routeNames.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedStop.routeNames.map((routeName, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded"
                    >
                      {routeName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Map>
    </div>
  )
})

MapView.displayName = 'MapView'

