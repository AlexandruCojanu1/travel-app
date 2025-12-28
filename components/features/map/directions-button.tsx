"use client"

import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shared/ui/dropdown-menu'
import { getDirectionsUrl } from '@/services/map/directions.service'
import type { RoutePoint } from '@/services/map/directions.service'

interface DirectionsButtonProps {
  points: RoutePoint[]
  className?: string
}

export function DirectionsButton({ points, className }: DirectionsButtonProps) {
  if (points.length === 0) return null

  const handleOpenDirections = (provider: 'google' | 'waze') => {
    const url = getDirectionsUrl(points, provider)
    if (url) {
      window.open(url, '_blank')
    }
  }

  if (points.length === 1) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleOpenDirections('google')}
        className={className}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Get Directions
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Get Directions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleOpenDirections('google')}>
          Open in Google Maps
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenDirections('waze')}>
          Open in Waze
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

