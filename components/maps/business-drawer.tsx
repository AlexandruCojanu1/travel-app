"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Star, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { AddToTripDrawer } from '@/components/plan/add-to-trip-drawer'
import { useTripStore } from '@/store/trip-store'
import type { MapBusiness } from '@/services/business.service'

interface BusinessDrawerProps {
  business: MapBusiness | null
  isOpen: boolean
  onClose: () => void
}

export function BusinessDrawer({ business, isOpen, onClose }: BusinessDrawerProps) {
  const router = useRouter()
  const [isAddToTripOpen, setIsAddToTripOpen] = useState(false)
  const { getDaysCount } = useTripStore()

  if (!business) return null

  const handleViewDetails = () => {
    router.push(`/business/${business.id}`)
  }

  const handleAddToPlan = () => {
    setIsAddToTripOpen(true)
  }

  const handleSuccess = (dayIndex: number) => {
    const dayNumber = dayIndex + 1
    toast.success(`Saved to Day ${dayNumber}! 🎒`, {
      duration: 3000,
    })
  }

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[50vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{business.name}</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto">
            <div className="flex gap-4">
              {/* Business Image */}
              <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {business.image_url ? (
                  <Image
                    src={business.image_url}
                    alt={business.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-xs">No image</span>
                  </div>
                )}
              </div>

              {/* Business Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1 truncate">
                  {business.name}
                </h3>

                {/* Category Badge */}
                <div className="inline-block px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600 mb-2">
                  {business.category}
                </div>

                {/* Rating */}
                {business.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{business.rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">/5.0</span>
                  </div>
                )}

                {/* Address */}
                {business.address && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {business.address}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={handleAddToPlan}
                    size="sm"
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add to Plan
                  </Button>
                  <Button
                    onClick={handleViewDetails}
                    size="sm"
                    className="flex-1"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Add to Trip Drawer */}
      <AddToTripDrawer
        business={business}
        isOpen={isAddToTripOpen}
        onOpenChange={setIsAddToTripOpen}
        onSuccess={handleSuccess}
      />
    </>
  )
}

