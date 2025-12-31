"use client"

import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/shared/ui/button'
import { AddToTripDrawer } from '@/components/features/trip/add-to-trip-drawer'
import { BookingDialog } from '@/components/features/booking/booking-dialog'
import { useTripStore } from '@/store/trip-store'
import { createClient } from '@/lib/supabase/client'
import type { Business } from '@/services/business/business.service'

interface StickyActionBarProps {
  business: Business
  bottomNavHeight?: number
}

export function StickyActionBar({
  business,
  bottomNavHeight = 80,
}: StickyActionBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [price, setPrice] = useState<string>('')
  const { getDaysCount } = useTripStore()

  // Load price from business resources
  useEffect(() => {
    async function loadPrice() {
      if (business.category !== 'Hotels') {
        setPrice('Gratis')
        return
      }

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('business_resources')
          .select('price_per_night')
          .eq('business_id', business.id)
          .eq('resource_type', 'room')
          .order('price_per_night', { ascending: true })
          .limit(1)

        if (error || !data || data.length === 0) {
          // Fallback: try without resource_type filter
          const { data: fallbackData } = await supabase
            .from('business_resources')
            .select('price_per_night')
            .eq('business_id', business.id)
            .order('price_per_night', { ascending: true })
            .limit(1)

          if (fallbackData && fallbackData.length > 0 && fallbackData[0].price_per_night) {
            setPrice(`De la ${fallbackData[0].price_per_night} RON/noapte`)
          } else {
            setPrice('Preț la cerere')
          }
        } else if (data[0].price_per_night) {
          setPrice(`De la ${data[0].price_per_night} RON/noapte`)
        } else {
          setPrice('Preț la cerere')
        }
      } catch (error) {
        setPrice('Preț la cerere')
      }
    }

    loadPrice()
  }, [business.id, business.category])

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
        className="fixed left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
        style={{ bottom: `${bottomNavHeight}px` }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Price Display */}
            {price && (
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                  {business.category === 'Hotels' ? 'Preț începând de la' : 'Preț'}
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {price}
                </p>
              </div>
            )}

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

