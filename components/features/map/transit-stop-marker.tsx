"use client"

import React from 'react'
import { Bus, Train } from "lucide-react"
import { ROUTE_TYPE_NAMES } from "@/services/map/gtfs.service"

interface TransitStopMarkerProps {
  name: string
  routeNames: string[]
  routeType: number
  isSelected?: boolean
  onClick?: () => void
}

export function TransitStopMarker({
  name,
  routeNames,
  routeType,
  isSelected = false,
  onClick,
}: TransitStopMarkerProps) {
  const getIcon = () => {
    switch (routeType) {
      case 0: // Tram
        return <Bus className="h-4 w-4" />
      case 1: // Metro
        return <Train className="h-4 w-4" />
      case 2: // Rail
        return <Train className="h-4 w-4" />
      default: // Bus, Trolleybus, etc.
        return <Bus className="h-4 w-4" />
    }
  }

  const getColor = () => {
    if (isSelected) return 'bg-secondary border-secondary-foreground'
    return 'bg-secondary/80 border-secondary'
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative cursor-pointer transition-all
        ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-40'}
      `}
    >
      <div
        className={`
          ${getColor()}
          border-2 rounded-full p-1.5 shadow-lg
          flex items-center justify-center
          text-white
        `}
        style={{ width: '32px', height: '32px' }}
      >
        {getIcon()}
      </div>

      {/* Route names badge */}
      {routeNames.length > 0 && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-semibold text-slate-800 shadow-md border border-slate-200">
            {routeNames.slice(0, 3).join(', ')}
            {routeNames.length > 3 && '+'}
          </div>
        </div>
      )}
    </div>
  )
}

