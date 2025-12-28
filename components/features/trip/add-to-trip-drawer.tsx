"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, DollarSign } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/shared/ui/drawer'
import { Button } from '@/components/shared/ui/button'
import { useTripStore } from '@/store/trip-store'
import { format } from 'date-fns'
import type { Business } from '@/services/business/business.service'
import type { MapBusiness } from '@/services/business/business.service'

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

  const estimatedCost = getPriceFromLevel(
    'price_level' in business ? business.price_level : undefined
  )

  // Calculate budget impact
  const budgetImpact =
    remaining > 0 ? Math.round((estimatedCost / remaining) * 100) : 0

  // Generate day options with dates
  const dayOptions = Array.from({ length: daysCount }).map((_, index) => {
    if (!tripDetails) return null
    const startDate = new Date(tripDetails.startDate)
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + index)
    return {
      index,
      label: `Day ${index + 1}`,
      date: format(dayDate, 'EEE d'),
    }
  })

  const handleCreateTrip = () => {
    onOpenChange(false)
    router.push('/plan')
  }

  const handleAddToDay = () => {
    if (!tripDetails) return

    addItem(
      {
        id: business.id,
        name: business.name,
        category: business.category,
        price_level:
          'price_level' in business ? business.price_level : undefined,
      },
      selectedDayIndex
    )

    onOpenChange(false)
    if (onSuccess) {
      onSuccess(selectedDayIndex)
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader>
          <DrawerTitle className="text-xl font-bold">
            Add {business.name} to...
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto space-y-6">
          {/* Case A: No Active Trip */}
          {!tripDetails ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Active Trip
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create a new trip first to start planning your itinerary
                </p>
                <Button
                  onClick={handleCreateTrip}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create a New Trip
                </Button>
              </div>
            </div>
          ) : (
            /* Case B: Active Trip */
            <>
              {/* Day Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Select Day
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {dayOptions.map((day) => {
                    if (!day) return null
                    const isSelected = selectedDayIndex === day.index
                    return (
                      <button
                        key={day.index}
                        onClick={() => setSelectedDayIndex(day.index)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">
                          {day.label}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {day.date}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Budget Impact */}
              {budget && remaining > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Budget Impact
                      </p>
                      <p className="text-xs text-gray-600">
                        Consumes ~{budgetImpact}% of remaining budget (
                        {estimatedCost.toFixed(0)} {budget.currency} /{' '}
                        {remaining.toFixed(0)} {budget.currency} remaining)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Button */}
              <Button
                onClick={handleAddToDay}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add to Day {selectedDayIndex + 1}
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

