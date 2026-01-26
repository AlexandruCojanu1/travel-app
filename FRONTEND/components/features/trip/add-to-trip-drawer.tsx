"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, DollarSign } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/shared/ui/drawer'
import { Button } from '@/components/shared/ui/button'
import { useTripStore } from '@/store/trip-store'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { Business, MapBusiness } from '@/actions/business'

interface AddToTripDrawerProps {
  business: Business | MapBusiness
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (dayIndex: number) => void
}

export function AddToTripDrawer({
  business,
  isOpen,
  onOpenChange,
  onSuccess,
}: AddToTripDrawerProps) {
  const router = useRouter()
  const { tripDetails, budget, getDaysCount, remainingBudget, addItem } =
    useTripStore()
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)

  const daysCount = tripDetails ? getDaysCount() : 0
  const remaining = remainingBudget()

  // Calculate estimated cost
  const getPriceFromLevel = (priceLevel: string | undefined): number => {
    const priceMap: Record<string, number> = {
      '€': 50,
      '€€': 150,
      '€€€': 400,
      'Free': 0,
    }
    return priceMap[priceLevel || '€€'] || 150
  }

  // Check if this is a nature reserve or recreation area (free)
  const isNatureOrActivity = business.category === 'Nature' ||
    business.category === 'Activities' ||
    business.id?.startsWith('nature-') ||
    business.id?.startsWith('recreation-')

  const estimatedCost = isNatureOrActivity ? 0 : getPriceFromLevel(
    'price_level' in business ? (business.price_level ?? undefined) : undefined
  )

  // Calculate budget impact (only for paid activities)
  const budgetImpact =
    remaining > 0 && estimatedCost > 0 ? Math.round((estimatedCost / remaining) * 100) : 0

  // Generate day options with dates
  const dayOptions = Array.from({ length: daysCount }).map((_, index) => {
    if (!tripDetails) return null
    const startDate = new Date(tripDetails.startDate)
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + index)
    return {
      index,
      label: `Ziua ${index + 1}`,
      date: format(dayDate, 'EEE d'),
    }
  })

  const handleCreateTrip = () => {
    onOpenChange(false)
    router.push('/plan')
  }

  const handleAddToDay = async () => {
    if (!tripDetails) return

    try {
      await addItem(
        {
          id: business.id,
          name: business.name,
          category: business.category,
          price_level:
            'price_level' in business ? (business.price_level ?? undefined) : undefined,
        },
        selectedDayIndex
      )

      onOpenChange(false)
      if (onSuccess) {
        onSuccess(selectedDayIndex)
      }
    } catch (error: any) {
      // Show error message if duplicate
      if (error.message) {
        toast.error(error.message)
      }
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader>
          <DrawerTitle className="text-xl font-bold">
            Adaugă {business.name} la...
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Alege ziua în care vrei să vizitezi această locație.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto space-y-6 max-h-[60vh]">
          {/* Case A: No Active Trip */}
          {!tripDetails ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nu există călătorie activă
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Creează o călătorie nouă pentru a începe să-ți planifici itinerariul
                </p>
                <Button
                  onClick={handleCreateTrip}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Creează o călătorie nouă
                </Button>
              </div>
            </div>
          ) : (
            /* Case B: Active Trip */
            <>
              {/* Day Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Selectează ziua
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {dayOptions.map((day) => {
                    if (!day) return null
                    const isSelected = selectedDayIndex === day.index
                    return (
                      <button
                        key={day.index}
                        onClick={() => setSelectedDayIndex(day.index)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                      >
                        <div className="font-semibold text-gray-900 text-sm">
                          {day.label}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {day.date}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Budget Impact - Only show for paid activities */}
              {budget && remaining > 0 && estimatedCost > 0 && (
                <div className="bg-secondary/10 rounded-xl p-4 border border-secondary/20">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Impact buget
                      </p>
                      <p className="text-xs text-gray-600">
                        Consumă ~{budgetImpact}% din bugetul rămas (
                        {estimatedCost.toFixed(0)} {budget.currency} /{' '}
                        {remaining.toFixed(0)} {budget.currency} rămas)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Button */}
              <Button
                onClick={handleAddToDay}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6"
              >
                <Plus className="h-5 w-5 mr-2" />
                Adaugă la Ziua {selectedDayIndex + 1}
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

