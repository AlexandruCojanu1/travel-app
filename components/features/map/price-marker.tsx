"use client"

import React from 'react'
import { UtensilsCrossed, Hotel, Trees, Compass, MapPin } from 'lucide-react'

interface PriceMarkerProps {
  price: number | string | null
  category?: string
  lat?: number
  lng?: number
  isSelected?: boolean
  onClick?: () => void
}

export function PriceMarker({ price, category, lat, lng, isSelected, onClick }: PriceMarkerProps) {
  if (price === null || price === undefined) return null

  // Get icon based on category
  const getCategoryIcon = () => {
    switch (category) {
      case 'Food':
        return <UtensilsCrossed className="h-4 w-4" />
      case 'Hotels':
        return <Hotel className="h-4 w-4" />
      case 'Nature':
        return <Trees className="h-4 w-4" />
      case 'Activities':
        return <Compass className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  // Handle price level strings (€€€, €€, €, Free) or numeric prices
  let displayText: string
  if (typeof price === 'string') {
    // Check if it's a price level string or a numeric string
    const numericValue = parseFloat(price)
    if (!isNaN(numericValue)) {
      displayText = `${numericValue} RON`
    } else {
      // It's a price level string like "€€€", "€€", "€", "Free"
      displayText = price
    }
  } else {
    displayText = `${price} RON`
  }

  const Icon = getCategoryIcon()

  return (
    <div
      className="relative cursor-pointer z-10"
      onClick={onClick}
    >
      <div className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg whitespace-nowrap
        ${isSelected ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}
        transition-all hover:scale-105
      `}>
        {Icon}
        <span>{displayText}</span>
      </div>
      {/* Pin pointer */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
        <div className={`w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
          isSelected ? 'border-t-purple-600' : 'border-t-blue-600'
        }`} />
      </div>
    </div>
  )
}

