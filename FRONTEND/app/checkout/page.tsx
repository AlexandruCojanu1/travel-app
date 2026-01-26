"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getBookingById } from '@/services/booking/booking.service'
import { BookingSummary } from '@/components/features/booking/checkout/booking-summary'
import { StripeWrapper } from '@/components/features/booking/checkout/stripe-wrapper'
import { Loader2, AlertCircle } from 'lucide-react'
import type { Booking } from '@/services/booking/booking.service'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = searchParams.get('bookingId')

  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId) {
        setError('Missing booking ID')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const result = await getBookingById(bookingId)

        if (!result) {
          setError('Booking not found')
          setIsLoading(false)
          return
        }

        // Check if booking is already confirmed
        if (result.status === 'confirmed') {
          router.push('/bookings?success=true')
          return
        }

        // Check if booking is in correct status
        if (result.status !== 'pending') {
          setError(`Booking is in ${result.status} status`)
          setIsLoading(false)
          return
        }

        // Validate required data
        if (!result.business || !result.room) {
          setError('Booking data is incomplete')
          setIsLoading(false)
          return
        }

        setBooking(result)
      } catch (err) {
        console.error('Error loading booking:', err)
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    loadBooking()
  }, [bookingId, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-mova-blue mx-auto mb-4" />
          <p className="text-mova-gray">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full airbnb-card border-red-200 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-mova-dark mb-2">
                Unable to Load Checkout
              </h3>
              <p className="text-sm text-mova-gray mb-4">
                {error || 'Booking not found'}
              </p>
              <button
                onClick={() => router.push('/bookings')}
                className="text-sm text-mova-blue hover:underline font-semibold"
              >
                Go to Bookings →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-mova-dark mb-2">Checkout</h1>
        <p className="text-mova-gray">
          Complete your payment to confirm your booking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Booking Summary */}
        <div>
          <BookingSummary
            business={booking.business!}
            startDate={booking.check_in}
            endDate={booking.check_out}
            guests={booking.guests}
            totalPrice={booking.total_price}
            pricePerNight={booking.price_per_night}
          />
        </div>

        {/* Right Column: Payment Form */}
        <div>
          <StripeWrapper
            bookingId={booking.id}
            amount={booking.total_price}
          />
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-mova-blue mx-auto mb-4" />
          <p className="text-mova-gray">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

