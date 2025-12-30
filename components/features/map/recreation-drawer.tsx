"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MapPin, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/shared/ui/drawer'
import { Button } from '@/components/shared/ui/button'
import { AddToTripDrawer } from '@/components/features/trip/add-to-trip-drawer'
import { useTripStore } from '@/store/trip-store'

interface RecreationDrawerProps {
  area: {
    name: string
    latitude: number
    longitude: number
    description: string
    category: string
  } | null
  isOpen: boolean
  onClose: () => void
}

export function RecreationDrawer({ area, isOpen, onClose }: RecreationDrawerProps) {
  const router = useRouter()
  const [isAddToTripOpen, setIsAddToTripOpen] = useState(false)
  const { getDaysCount } = useTripStore()

  if (!area) return null

  const handleAddToPlan = () => {
    setIsAddToTripOpen(true)
  }

  const handleSuccess = (dayIndex: number) => {
    const dayNumber = dayIndex + 1
    toast.success(`Adăugat la Ziua ${dayNumber}! 🎒`, {
      duration: 3000,
    })
  }

  // Convert area to business-like format for AddToTripDrawer
  // Recreation areas are also free (nature/outdoor activities)
  const areaAsBusiness = {
    id: `recreation-${area.name.replace(/\s+/g, '-').toLowerCase()}`,
    name: area.name,
    category: 'Activities',
    price_level: 'Free' as const,
    latitude: area.latitude,
    longitude: area.longitude,
    description: area.description,
    rating: null,
    image_url: null,
    address: null,
  }

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[50vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{area.name}</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto">
            <div className="flex gap-4">
              {/* Icon */}
              <div className="relative w-24 h-24 flex-shrink-0 rounded-airbnb overflow-hidden bg-purple-50 flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-purple-600" />
              </div>

              {/* Area Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1 truncate text-mova-dark">
                  {area.name}
                </h3>

                {/* Category Badge */}
                <div className="inline-block px-2.5 py-1 bg-purple-50 rounded-airbnb text-xs text-purple-800 font-semibold mb-2">
                  Agrement
                </div>

                {/* Description */}
                <p className="text-xs text-mova-gray mb-3 line-clamp-2">
                  {area.description}
                </p>

                {/* Action Button */}
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={handleAddToPlan}
                    size="sm"
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adaugă în plan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Add to Trip Drawer */}
      <AddToTripDrawer
        business={areaAsBusiness as any}
        isOpen={isAddToTripOpen}
        onOpenChange={setIsAddToTripOpen}
        onSuccess={handleSuccess}
      />
    </>
  )
}

