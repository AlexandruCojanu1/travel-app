"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MapPin, Leaf } from 'lucide-react'
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

interface NatureDrawerProps {
  reserve: {
    name: string
    latitude: number
    longitude: number
    description: string
    area_hectares: number | null
    iucn_category: string
    reserve_type: string
  } | null
  isOpen: boolean
  onClose: () => void
}

export function NatureDrawer({ reserve, isOpen, onClose }: NatureDrawerProps) {
  const router = useRouter()
  const [isAddToTripOpen, setIsAddToTripOpen] = useState(false)
  const { getDaysCount } = useTripStore()

  if (!reserve) return null

  const handleAddToPlan = () => {
    setIsAddToTripOpen(true)
  }

  const handleSuccess = (dayIndex: number) => {
    const dayNumber = dayIndex + 1
    toast.success(`Adăugat la Ziua ${dayNumber}! 🎒`, {
      duration: 3000,
    })
  }

  // Convert reserve to business-like format for AddToTripDrawer
  const reserveAsBusiness = {
    id: `nature-${reserve.name.replace(/\s+/g, '-').toLowerCase()}`,
    name: reserve.name,
    category: 'Nature',
    price_level: 'Free' as const,
    latitude: reserve.latitude,
    longitude: reserve.longitude,
    description: reserve.description,
    rating: null,
    image_url: null,
    address: null,
  }

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[50vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{reserve.name}</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto">
            <div className="flex gap-4">
              {/* Icon */}
              <div className="relative w-24 h-24 flex-shrink-0 rounded-airbnb overflow-hidden bg-green-50 flex items-center justify-center">
                <Leaf className="h-12 w-12 text-green-600" />
              </div>

              {/* Reserve Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1 truncate text-mova-dark">
                  {reserve.name}
                </h3>

                {/* Category Badge */}
                <div className="inline-block px-2.5 py-1 bg-green-50 rounded-airbnb text-xs text-green-800 font-semibold mb-2">
                  Rezervație naturală
                </div>

                {/* Description */}
                <p className="text-xs text-mova-gray mb-2 line-clamp-2">
                  {reserve.description}
                </p>

                {/* Details */}
                <div className="flex flex-wrap gap-2 text-xs text-mova-gray mb-3">
                  {reserve.area_hectares && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {reserve.area_hectares} ha
                    </span>
                  )}
                  <span>IUCN {reserve.iucn_category}</span>
                  <span>•</span>
                  <span>{reserve.reserve_type}</span>
                </div>

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
        business={reserveAsBusiness as any}
        isOpen={isAddToTripOpen}
        onOpenChange={setIsAddToTripOpen}
        onSuccess={handleSuccess}
      />
    </>
  )
}

