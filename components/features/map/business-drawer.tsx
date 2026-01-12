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
  DrawerDescription,
} from '@/components/shared/ui/drawer'
import { Button } from '@/components/shared/ui/button'
import { AddToTripDrawer } from '@/components/features/trip/add-to-trip-drawer'
import { HotelBookingDrawer } from '@/components/features/explore/hotel-booking-drawer'
import { useTripStore } from '@/store/trip-store'
import { useUIStore } from '@/store/ui-store'
import type { MapBusiness } from '@/services/business/business.service'

interface BusinessDrawerProps {
  business: MapBusiness | null
  isOpen: boolean
  onClose: () => void
}

export function BusinessDrawer({ business, isOpen, onClose }: BusinessDrawerProps) {
  const router = useRouter()
  const [isAddToTripOpen, setIsAddToTripOpen] = useState(false)
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const { getDaysCount } = useTripStore()
  const { openBusinessDrawer } = useUIStore()

  if (!business) return null

  const isHotel = business.category === 'Hotel'

  const handleViewDetails = () => {
    onClose()
    openBusinessDrawer(business.id)
  }

  const handleAddToPlan = () => {
    if (isHotel) {
      setIsBookingDialogOpen(true)
    } else {
      setIsAddToTripOpen(true)
    }
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
            <DrawerDescription>Previzualizare business.</DrawerDescription>
          </DrawerHeader>

          <div className="px-5 pb-8 overflow-y-auto">
            <div className="flex gap-4">
              {/* Business Image */}
              <div className="relative w-28 h-28 flex-shrink-0 rounded-2xl overflow-hidden bg-muted shadow-sm">
                {business.image_url ? (
                  <Image
                    src={business.image_url}
                    alt={business.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <span className="text-xs">Fără img</span>
                  </div>
                )}
              </div>

              {/* Business Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xl leading-tight text-foreground truncate pl-1">
                    {business.name}
                  </h3>

                  {/* Category Badge & Rating Row */}
                  <div className="flex items-center gap-2 mt-1.5 mb-2 pl-1">
                    <div className="inline-flex px-2.5 py-0.5 bg-secondary/30 rounded-full text-xs text-primary font-semibold">
                      {business.category}
                    </div>
                    {business.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-foreground">{business.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  {business.address && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pl-1 mb-3">
                      {business.address}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddToPlan}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-primary/20 text-primary hover:text-primary hover:bg-primary/5 rounded-xl h-9 text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    {isHotel ? 'Rezervă' : 'Adaugă'}
                  </Button>
                  <Button
                    onClick={handleViewDetails}
                    size="sm"
                    className="flex-1 bg-primary text-white hover:bg-primary/90 rounded-xl h-9 text-xs font-semibold shadow-md shadow-primary/20"
                  >
                    Detalii
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Add to Trip Drawer (for non-hotels) */}
      {!isHotel && (
        <AddToTripDrawer
          business={business}
          isOpen={isAddToTripOpen}
          onOpenChange={setIsAddToTripOpen}
          onSuccess={handleSuccess}
        />
      )}

      {/* Booking Drawer (for hotels) */}
      {isHotel && (
        <HotelBookingDrawer
          business={business}
          isOpen={isBookingDialogOpen}
          onClose={() => setIsBookingDialogOpen(false)}
          onBooked={() => {
            setIsBookingDialogOpen(false)
            toast.success('Rezervare confirmată! 🎉')
          }}
        />
      )}
    </>
  )
}

