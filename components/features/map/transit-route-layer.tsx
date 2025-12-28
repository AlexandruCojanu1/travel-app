"use client"

import React from 'react'
import { Source, Layer } from 'react-map-gl'
import type { TransitRoute } from '@/services/map/gtfs.service'

interface TransitRouteLayerProps {
  routes: TransitRoute[]
  visible?: boolean
}

export function TransitRouteLayer({ routes, visible = true }: TransitRouteLayerProps) {
  if (!visible || routes.length === 0) return null

  // Group routes by type for better performance
  const routesByType = routes.reduce((acc, route) => {
    if (!acc[route.type]) {
      acc[route.type] = []
    }
    acc[route.type].push(route)
    return acc
  }, {} as Record<number, TransitRoute[]>)

  return (
    <>
      {Object.entries(routesByType).map(([type, typeRoutes]: [string, TransitRoute[]]) => {
        const typedRoutes = typeRoutes as TransitRoute[]
        return (
          <Source
            key={`transit-routes-${type}`}
            id={`transit-routes-${type}`}
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: typedRoutes.map(route => ({
                type: 'Feature',
                properties: {
                  routeId: route.id,
                  routeName: route.shortName,
                  routeType: route.type,
                  color: route.color,
                },
                geometry: {
                  type: 'LineString',
                  coordinates: route.shape.map(point => [point.lng, point.lat]),
                },
              })),
            }}
          >
            <Layer
              id={`transit-route-line-${type}`}
              type="line"
              paint={{
                'line-color': ['get', 'color'],
                'line-width': 3,
                'line-opacity': 0.7,
              }}
            />
          </Source>
        )
      })}
    </>
  )
}

