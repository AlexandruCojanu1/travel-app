"use client"

import React from 'react'

interface ClusterMarkerProps {
  pointCount?: number
  count?: number
  lat?: number
  lng?: number
  onClick?: () => void
}

export function ClusterMarker({ pointCount, count, lat, lng, onClick }: ClusterMarkerProps) {
  const pointCountValue = pointCount || count || 0
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      style={{ left: `${lng || 0}px`, top: `${lat || 0}px` }}
      onClick={onClick}
    >
      <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg">
        {pointCountValue}
      </div>
    </div>
  )
}

