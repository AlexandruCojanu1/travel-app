"use client"

import React, { useMemo } from 'react'
import { DollarSign, Clock, MapPin } from 'lucide-react'
import {
  calculateTransportCosts,
  getTransportModeLabel,
  getTransportModeIcon,
  type TransportMode,
  type TransportCost,
} from '@/services/map/transport-costs.service'
import type { RoutePoint } from '@/services/map/directions.service'
import { cn } from '@/lib/utils'

interface TransportCostsPanelProps {
  points: RoutePoint[]
  selectedMode: TransportMode
  onModeChange: (mode: TransportMode) => void
  cityName?: string
}

const transportModes: TransportMode[] = [
  'walking',
  'transit',
  'walking-transit',
  'car',
  'taxi',
]

export function TransportCostsPanel({
  points,
  selectedMode,
  onModeChange,
  cityName,
}: TransportCostsPanelProps) {
  const [costs, setCosts] = React.useState<Awaited<ReturnType<typeof calculateTransportCosts>> | null>(null)
  const [isCalculating, setIsCalculating] = React.useState(false)
  
  // Memoize points to prevent infinite recalculations
  const pointsKey = useMemo(() => 
    points.map(p => `${p.latitude},${p.longitude}`).join('|'),
    [points]
  )
  
  // Calculate costs when points or mode changes
  React.useEffect(() => {
    if (points.length < 2) {
      setCosts(null)
      return
    }

    setIsCalculating(true)
    
    async function calculate() {
      try {
        const result = await calculateTransportCosts(points, selectedMode, cityName)
        setCosts(result)
      } catch (error) {
        console.error('Error calculating transport costs:', error)
        setCosts(null)
      } finally {
        setIsCalculating(false)
      }
    }

    calculate()
  }, [pointsKey, selectedMode, points.length, cityName])

  if (isCalculating) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Se calculează ruta reală...</p>
        </div>
      </div>
    )
  }

  if (!costs || points.length < 2) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500">
        <p className="text-sm">Adaugă cel puțin 2 locații pentru a calcula costurile</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex flex-wrap gap-2">
        {transportModes.map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={cn(
              'px-4 py-2 rounded-lg font-semibold text-sm transition-all border-2',
              selectedMode === mode
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            )}
          >
            <span className="mr-2">{getTransportModeIcon(mode)}</span>
            {getTransportModeLabel(mode)}
          </button>
        ))}
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getTransportModeIcon(selectedMode)}</span>
            <h3 className="text-lg font-bold text-gray-900">
              {getTransportModeLabel(selectedMode)}
            </h3>
          </div>
          {costs.isRealRoute && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
              ✓ Rută reală
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Distance */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-600">Distanță</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {costs.totalDistance.toFixed(1)} km
            </p>
          </div>

          {/* Duration */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-600">Durată</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {costs.totalDuration} min
            </p>
          </div>

          {/* Cost */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-gray-600">Cost</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {costs.totalCost.toFixed(2)} RON
            </p>
          </div>
        </div>

        {/* Segments Breakdown */}
        {costs.segments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Detalii traseu:
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {costs.segments.map((segment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-100 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {segment.from} → {segment.to}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                      <span>{segment.distance.toFixed(1)} km</span>
                      <span>•</span>
                      <span>{segment.duration} min</span>
                    </div>
                  </div>
                  {segment.cost > 0 && (
                    <div className="ml-3 flex-shrink-0">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-semibold text-xs">
                        {segment.cost.toFixed(2)} RON
                      </span>
                    </div>
                  )}
                  {segment.cost === 0 && (
                    <div className="ml-3 flex-shrink-0">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded font-semibold text-xs">
                        Gratis
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

