"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, Loader2, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Business, MapBusiness } from '@/services/business/business.service'

interface BookingDialogProps {
  business: Business | MapBusiness
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

interface BusinessResource {
  id: string
  name: string
  price_per_night: number
  description: string | null
}

export function BookingDialog({ business, isOpen, onOpenChange }: BookingDialogProps) {
  const router = useRouter()
  const [resources, setResources] = useState<BusinessResource[]>([])
  const [selectedResourceId, setSelectedResourceId] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [guestCount, setGuestCount] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load resources when dialog opens
  useEffect(() => {
    if (isOpen && business.id) {
      loadResources()
    }
  }, [isOpen, business.id])

  const loadResources = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: resourcesError } = await supabase
        .from('business_resources')
        .select('id, name, price_per_night, description')
        .eq('business_id', business.id)
        .eq('resource_type', 'room')
        .order('price_per_night', { ascending: true })

      if (resourcesError) {
        console.error('Error loading resources:', resourcesError)
        // Fallback: try without resource_type filter
        const { data: fallbackData } = await supabase
          .from('business_resources')
          .select('id, name, price_per_night, description')
          .eq('business_id', business.id)
          .order('price_per_night', { ascending: true })
        
        if (fallbackData) {
          setResources(fallbackData)
          if (fallbackData.length > 0) {
            setSelectedResourceId(fallbackData[0].id)
          }
        }
      } else if (data) {
        setResources(data)
        if (data.length > 0) {
          setSelectedResourceId(data[0].id)
        }
      }
    } catch (err) {
      console.error('Error loading resources:', err)
      setError('Failed to load available rooms')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBooking = async () => {
    if (!selectedResourceId || !startDate || !endDate) {
      setError('Please fill in all required fields')
      return
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          resource_id: selectedResourceId,
          business_id: business.id,
          start_date: startDate,
          end_date: endDate,
          guest_count: guestCount,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to create booking')
        setIsCreating(false)
        return
      }

      // Redirect to checkout
      toast.success('Booking created! Redirecting to checkout...')
      router.push(`/checkout?bookingId=${result.bookingId}`)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Error creating booking:', err)
      setError(err.message || 'Failed to create booking')
      setIsCreating(false)
    }
  }

  const selectedResource = resources.find((r) => r.id === selectedResourceId)
  const nights = startDate && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const totalPrice = selectedResource ? selectedResource.price_per_night * nights : 0

  const today = new Date().toISOString().split('T')[0]
  const minEndDate = startDate || today

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Book {business.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Resource Selection */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : resources.length > 0 ? (
            <div>
              <Label className="text-base font-semibold mb-3">Select Room</Label>
              <div className="space-y-2">
                {resources.map((resource) => (
                  <button
                    key={resource.id}
                    onClick={() => setSelectedResourceId(resource.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedResourceId === resource.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{resource.name}</p>
                        {resource.description && (
                          <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                        )}
                      </div>
                      <p className="font-bold text-blue-600">
                        {resource.price_per_night} RON/night
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800">
                No rooms available. Please contact the business directly.
              </p>
            </div>
          )}

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date" className="text-base font-semibold mb-2">
                Check-in
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="end-date" className="text-base font-semibold mb-2">
                Check-out
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={minEndDate}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Guest Count */}
          <div>
            <Label htmlFor="guests" className="text-base font-semibold mb-2">
              Guests
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="guests"
                type="number"
                min="1"
                max="20"
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Price Summary */}
          {selectedResource && startDate && endDate && nights > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {selectedResource.price_per_night} RON × {nights} {nights === 1 ? 'night' : 'nights'}
                  </span>
                  <span className="font-semibold text-gray-900">{totalPrice.toFixed(2)} RON</span>
                </div>
                <div className="pt-2 border-t border-blue-200 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-blue-600">{totalPrice.toFixed(2)} RON</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleCreateBooking}
            disabled={!selectedResourceId || !startDate || !endDate || isCreating || nights === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Booking...
              </>
            ) : (
              'Continue to Payment'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

