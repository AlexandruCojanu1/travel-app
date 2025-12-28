"use client"

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/shared/ui/button'
import { AddToTripDrawer } from '@/components/features/trip/add-to-trip-drawer'
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
  const { getDaysCount } = useTripStore()

  // Determine action text based on business type
  const isHotel = business.category === 'Hotels'
  const actionText = isHotel ? 'Book Now' : 'Add to Plan'

  const handleAction = () => {
    if (isHotel) {
      // TODO: Implement booking flow
      console.log('Book Now clicked for:', business.id)
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
        className="fixed left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
        style={{ bottom: `${bottomNavHeight}px` }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Price Display */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                Starting from
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {price}
              </p>
            </div>

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
        </div>
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
    </>
  )
}

