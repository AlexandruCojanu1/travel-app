"use client"

import React from 'react'

interface PriceMarkerProps {
  price: number | string | null
  lat?: number
  lng?: number
  isSelected?: boolean
  onClick?: () => void
}

export function PriceMarker({ price, lat, lng, isSelected, onClick }: PriceMarkerProps) {
  if (price === null || price === undefined) return null

  const priceValue = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(priceValue)) return null

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
      style={{ left: `${lng || 0}px`, top: `${lat || 0}px` }}
      onClick={onClick}
    >
      <div className={`
        px-2 py-1 rounded-lg text-xs font-semibold shadow-lg
        ${isSelected ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}
      `}>
        {priceValue} RON
      </div>
    </div>
  )
}

