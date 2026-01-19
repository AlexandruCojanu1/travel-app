import React from 'react'
import { Car, Bus, Users } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import type { RoutePoint } from '@/services/map/routing.service'

interface TransportCostsPanelProps {
  points: RoutePoint[]
  cityName?: string
  // Props kept for compatibility but ignored
  selectedMode?: any
  onModeChange?: any
}

export function TransportCostsPanel({
  points,
}: TransportCostsPanelProps) {
  // If no points, we can't navigate anywhere
  if (!points || points.length === 0) return null

  // Use the first point as destination for navigation
  // Logic: Usually we want to navigate TO the activity.
  const destination = points[0]

  const handleOpenWaze = () => {
    if (!destination) return
    // Waze URL scheme
    // navigate=yes ensures it starts navigation immediately
    const url = `https://waze.com/ul?ll=${destination.latitude},${destination.longitude}&navigate=yes`
    window.open(url, '_blank')
  }

  const handleOpenGoogleMaps = (mode: 'transit' | 'walking') => {
    if (!destination) return
    // Google Maps URL scheme
    const travelMode = mode === 'transit' ? 'transit' : 'walking'
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=${travelMode}`
    window.open(url, '_blank')
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-blue-100 shadow-sm">
      <div className="grid grid-cols-3 gap-3">
        {/* Personal Car -> Waze */}
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-auto py-3 gap-2 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all"
          onClick={handleOpenWaze}
        >
          <Car className="w-6 h-6 text-blue-600" />
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-700">Mașină</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-tight">Waze</span>
          </div>
        </Button>

        {/* Public Transport -> Google Maps */}
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-auto py-3 gap-2 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all"
          onClick={() => handleOpenGoogleMaps('transit')}
        >
          <Bus className="w-6 h-6 text-blue-600" />
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-700">Transport</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-tight">Google Maps</span>
          </div>
        </Button>

        {/* Walking -> Google Maps */}
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-auto py-3 gap-2 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all"
          onClick={() => handleOpenGoogleMaps('walking')}
        >
          <Users className="w-6 h-6 text-blue-600" />
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-700">Mers pe jos</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-tight">Google Maps</span>
          </div>
        </Button>
      </div>
    </div>
  )
}
