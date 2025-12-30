"use client"

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/shared/ui/button'
import { AddToTripDrawer } from '@/components/features/trip/add-to-trip-drawer'
import { BookingDialog } from '@/components/features/booking/booking-dialog'
import { useTripStore } from '@/store/trip-store'
import type { Business } from '@/services/business/business.service'

interface StickyActionBarProps {
  business: Business
  price?: string // e.g., "200 RON / night" or "Free"
  bottomNavHeight?: number
}

export function StickyActionBar({
  business,
  price = '200 RON / night',
  bottomNavHeight = 80,
}: StickyActionBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const { getDaysCount } = useTripStore()

  // Determine action text based on business type
  const isHotel = business.category === 'Hotels'
  const actionText = isHotel ? 'Rezervă acum' : 'Adaugă în plan'

  const handleAction = () => {
    if (isHotel) {
      setIsBookingDialogOpen(true)
    } else {
      setIsDrawerOpen(true)
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
      <div
        className="fixed z-50"
        style={{ 
          bottom: `${bottomNavHeight + 20}px`,
          right: '20px'
        }}
      >
        {/* Action Button */}
        <Button
          onClick={handleAction}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 md:px-8 py-6 md:py-7 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          {isHotel ? (
            actionText
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              {actionText}
            </>
          )}
        </Button>
      </div>

      {/* Add to Plan Drawer (for non-hotels) */}
      {!isHotel && (
        <AddToTripDrawer
          business={business}
          isOpen={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          onSuccess={handleSuccess}
        />
      )}

      {/* Booking Dialog (for hotels) */}
      {isHotel && (
        <BookingDialog
          business={business}
          isOpen={isBookingDialogOpen}
          onOpenChange={setIsBookingDialogOpen}
        />
      )}
    </>
  )
}

