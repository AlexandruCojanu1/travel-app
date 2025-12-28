"use client"

import { useState } from 'react'
import { Route, Zap, RotateCcw } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { optimizeRoute, calculateRouteMetrics, formatDistance, formatDuration } from '@/services/map/directions.service'
import type { RoutePoint } from '@/services/map/directions.service'

interface RouteOptimizerProps {
  points: RoutePoint[]
  onOptimized?: (optimized: RoutePoint[]) => void
}

export function RouteOptimizer({ points, onOptimized }: RouteOptimizerProps) {
  const [isOptimized, setIsOptimized] = useState(false)
  const [originalOrder, setOriginalOrder] = useState<RoutePoint[]>([])

  if (points.length < 3) return null // No need to optimize with less than 3 points

  const handleOptimize = () => {
    if (!isOptimized) {
      setOriginalOrder([...points])
      const optimized = optimizeRoute(points)
      onOptimized?.(optimized)
      setIsOptimized(true)
    } else {
      // Restore original order
      onOptimized?.(originalOrder)
      setIsOptimized(false)
    }
  }

  const metrics = calculateRouteMetrics(points)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm mb-1">Route Optimization</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Distance: {formatDistance(metrics.distance)}</div>
            <div>Est. Duration: {formatDuration(metrics.duration)}</div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOptimize}
        >
          {isOptimized ? (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Optimize
            </>
          )}
        </Button>
      </div>
      {isOptimized && (
        <p className="text-xs text-green-600">
          Route optimized for shortest distance
        </p>
      )}
    </div>
  )
}

