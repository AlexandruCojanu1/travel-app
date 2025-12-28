"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, ArrowRight, ArrowLeft, MapPin } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog'
import { Button } from '@/components/shared/ui/button'
import { Slider } from '@/components/shared/ui/slider'
import { useTripStore } from '@/store/trip-store'
import { useAppStore } from '@/store/app-store'
import { getActiveCities } from '@/services/city.service'

interface CreateTripDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 1 | 2 | 3

export function CreateTripDialog({
  isOpen,
  onOpenChange,
}: CreateTripDialogProps) {
  const { currentCity, openCitySelector } = useAppStore()
  const { initTrip, syncToDatabase } = useTripStore()
  const [step, setStep] = useState<Step>(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budget, setBudget] = useState([2000])
  const [selectedCity, setSelectedCity] = useState(currentCity)
  const [cities, setCities] = useState<Array<{ id: string; name: string; country: string }>>([])

  useEffect(() => {
    // Load cities for dropdown
    getActiveCities().then((data) => {
      setCities(data.map((c) => ({ id: c.id, name: c.name, country: c.country })))
    })
  }, [])

  useEffect(() => {
    // Sync with currentCity from store
    if (currentCity) {
      setSelectedCity(currentCity)
    }
  }, [currentCity])

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as Step)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step)
    }
  }

  const handleFinish = async () => {
    if (!selectedCity || !startDate || !endDate) {
      return
    }

    initTrip(
      {
        cityId: selectedCity.id,
        cityName: selectedCity.name,
        startDate,
        endDate,
        title: `Trip to ${selectedCity.name}`,
      },
      {
        total: budget[0],
        currency: 'RON',
      }
    )

    // Force immediate sync to create DB record
    await syncToDatabase()

    // Reset form
    setStep(1)
    setStartDate('')
    setEndDate('')
    setBudget([2000])
    onOpenChange(false)
  }

  const canProceedStep1 = selectedCity && startDate && endDate && new Date(endDate) >= new Date(startDate)
  const canFinish = canProceedStep1 && budget[0] > 0

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && 'Select Destination & Dates'}
            {step === 2 && 'Set Your Budget'}
            {step === 3 && 'Review & Create'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: City & Dates */}
          {step === 1 && (
            <div className="space-y-6">
              {/* City Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination
                </label>
                <select
                  value={selectedCity?.id || ''}
                  onChange={(e) => {
                    const city = cities.find((c) => c.id === e.target.value)
                    if (city) {
                      setSelectedCity({
                        id: city.id,
                        name: city.name,
                        country: city.country,
                        state_province: null,
                        latitude: 0,
                        longitude: 0,
                        is_active: true,
                        created_at: '',
                      })
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a city...</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}, {city.country}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={openCitySelector}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  Browse all cities
                </button>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={today}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || today}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {startDate && endDate && new Date(endDate) < new Date(startDate) && (
                <p className="text-sm text-red-600">
                  End date must be after start date
                </p>
              )}
            </div>
          )}

          {/* Step 2: Budget */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Budget: {budget[0].toLocaleString()} RON
                </label>
                <Slider
                  value={budget}
                  onValueChange={setBudget}
                  min={500}
                  max={10000}
                  step={100}
                  className="w-full"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>500 RON</span>
                  <span>10,000 RON</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Tip:</strong> This is your total budget for the trip. You can adjust individual item costs later.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Destination</p>
                  <p className="font-semibold text-gray-900">
                    {selectedCity?.name}, {selectedCity?.country}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Dates</p>
                  <p className="font-semibold text-gray-900">
                    {startDate && new Date(startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {endDate && new Date(endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Budget</p>
                  <p className="font-semibold text-gray-900">
                    {budget[0].toLocaleString()} RON
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-2 rounded-full transition-colors ${
                  s <= step ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceedStep1}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={!canFinish}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Create Trip
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

