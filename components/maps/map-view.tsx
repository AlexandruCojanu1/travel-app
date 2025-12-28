"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react'
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
  onMapMove?: (bounds: { north: number; south: number; east: number; west: number }) => void
  cityName?: string
  showTransit?: boolean
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

export function MapView({
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
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState({
    latitude: initialLatitude,
    longitude: initialLongitude,
    zoom: initialZoom,
  })
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

    // Convert businesses to GeoJSON points
    const points: PointFeature[] = businesses.map((business) => ({
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

    cluster.load(points)
    return cluster
  }, [businesses])

  // Get clusters for current map bounds and zoom
  const { clusters, bounds } = useMemo(() => {
    const map = mapRef.current
    if (!map) {
      return { clusters: [], bounds: null }
    }

    const mapBounds = map.getMap().getBounds()
    const boundsArray: [number, number, number, number] = [
      mapBounds.getWest(),
      mapBounds.getSouth(),
      mapBounds.getEast(),
      mapBounds.getNorth(),
    ]

    return {
      clusters: supercluster.getClusters(boundsArray, Math.floor(viewState.zoom)),
      bounds: {
        west: boundsArray[0],
        south: boundsArray[1],
        east: boundsArray[2],
        north: boundsArray[3],
      },
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
    if (!showTransit || !cityName || !bounds) return

    const loadTransitData = async () => {
      setIsLoadingTransit(true)
      try {
        const feedPath = getFeedPathForCity(cityName)
        if (!feedPath) {
          console.log('No GTFS feed found for city:', cityName)
          setIsLoadingTransit(false)
          return
        }

        // Load stops within current map bounds
        const stops = await getTransitStops(feedPath, bounds)
        setTransitStops(stops)

        // Load routes (limit to first 50 for performance)
        const allRoutes = await getTransitRoutes(feedPath)
        setTransitRoutes(allRoutes.slice(0, 50))
      } catch (error) {
        console.error('Error loading transit data:', error)
      } finally {
        setIsLoadingTransit(false)
      }
    }

    loadTransitData()
  }, [showTransit, cityName, bounds])

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
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        mapLib={import('maplibre-gl') as any}
        style={{ width: '100%', height: '100%' }}
        maxZoom={20}
        minZoom={3}
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

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md">
            <NavigationControl showCompass={false} />
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md">
            <GeolocateControl
              positionOptions={{ enableHighAccuracy: true }}
              trackUserLocation={true}
            />
          </div>
        </div>

        {/* Transit Stop Info Popup */}
        {showTransit && selectedStop && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-white rounded-xl shadow-xl p-4 max-w-xs border-2 border-blue-200">
              <h3 className="font-semibold text-slate-900 mb-1">{selectedStop.name}</h3>
              {selectedStop.description && (
                <p className="text-xs text-slate-600 mb-2">{selectedStop.description}</p>
              )}
              {selectedStop.routeNames.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedStop.routeNames.map((routeName, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded"
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
}

