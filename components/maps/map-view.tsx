"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import Supercluster from 'supercluster'
import 'maplibre-gl/dist/maplibre-gl.css'
import { PriceMarker } from './price-marker'
import { ClusterMarker } from './cluster-marker'
import type { MapBusiness } from '@/services/business.service'

interface MapViewProps {
  businesses: MapBusiness[]
  initialLatitude: number
  initialLongitude: number
  initialZoom?: number
  bottomNavHeight?: number
  onBusinessSelect: (business: MapBusiness | null) => void
  selectedBusinessId: string | null
  onMapMove?: (bounds: { north: number; south: number; east: number; west: number }) => void
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
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState({
    latitude: initialLatitude,
    longitude: initialLongitude,
    zoom: initialZoom,
  })

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
      </Map>
    </div>
  )
}

