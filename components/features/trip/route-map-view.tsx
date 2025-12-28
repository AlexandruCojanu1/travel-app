"use client"

import React, { useMemo, useState } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl'
import { useTripStore } from '@/store/trip-store'
import { getBusinessById } from '@/services/business/business.service'
import { MapPin } from 'lucide-react'
import { RouteOptimizer } from '@/components/features/map/route-optimizer'
import { DirectionsButton } from '@/components/features/map/directions-button'
import type { Business } from '@/services/business/business.service'
import type { RoutePoint } from '@/services/map/directions.service'

interface RouteMapViewProps {
  dayIndex: number
  height?: string
}

export function RouteMapView({ dayIndex, height = '400px' }: RouteMapViewProps) {
  const { getItemsByDay, tripDetails, reorderItems } = useTripStore()
  const [businesses, setBusinesses] = React.useState<Business[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const items = getItemsByDay(dayIndex)

  // Load business details for all items
  React.useEffect(() => {
    async function loadBusinesses() {
      if (items.length === 0) {
        setBusinesses([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const businessPromises = items.map((item) => getBusinessById(item.business_id))
        const businessResults = await Promise.all(businessPromises)
        const validBusinesses = businessResults.filter(
          (b): b is Business => b !== null && b.latitude !== null && b.longitude !== null
        )
        setBusinesses(validBusinesses)
      } catch (error) {
        console.error('Error loading businesses for route:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBusinesses()
  }, [items])

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
    // Map optimized points back to item IDs
    const optimizedIds = optimizedPoints
      .map(p => p.id)
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

  // Create route line connecting businesses in order
  const routeLine = useMemo(() => {
    if (businesses.length < 2) return null

    const coordinates = businesses
      .map((b) => [b.longitude!, b.latitude!] as [number, number])
      .filter((coord) => coord[0] !== null && coord[1] !== null)

    if (coordinates.length < 2) return null

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates,
      },
      properties: {},
    }
  }, [businesses])

  if (isLoading) {
    return (
      <div
        className="w-full bg-gray-100 rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-gray-500">Loading route...</div>
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
          <p>No locations added for this day</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {businesses.length >= 2 && (
        <div className="flex items-center justify-between gap-4">
          <RouteOptimizer
            points={routePoints}
            onOptimized={handleOptimized}
          />
          <DirectionsButton points={routePoints} />
        </div>
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
                {index + 1}
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

