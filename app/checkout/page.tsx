"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getBookingDetails } from '@/services/booking.service'
import { BookingSummary } from '@/components/checkout/booking-summary'
import { StripeWrapper } from '@/components/checkout/stripe-wrapper'
import { Loader2, AlertCircle } from 'lucide-react'
import type { Business } from '@/services/business.service'

interface BookingData {
  id: string
  start_date: string
  end_date: string
  guest_count: number
  total_amount: number
  status: string
  business: Business
  resource: {
    id: string
    name: string
    price_per_night: number
  }
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = searchParams.get('bookingId')

  const [booking, setBooking] = useState<BookingData | null>(null)
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

        const result = await getBookingDetails(bookingId)

        if (!result.success || !result.booking) {
          setError(result.error || 'Booking not found')
          setIsLoading(false)
          return
        }

        // Check if booking is already confirmed
        if (result.booking.status === 'confirmed') {
          router.push('/bookings?success=true')
          return
        }

        // Check if booking is in correct status
        if (result.booking.status !== 'awaiting_payment') {
          setError(`Booking is in ${result.booking.status} status`)
          setIsLoading(false)
          return
        }

        // Validate required data
        if (!result.booking.business || !result.booking.resource) {
          setError('Booking data is incomplete')
          setIsLoading(false)
          return
        }

        setBooking(result.booking as BookingData)
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
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unable to Load Checkout
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {error || 'Booking not found'}
              </p>
              <button
                onClick={() => router.push('/bookings')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600">
          Complete your payment to confirm your booking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Booking Summary */}
        <div>
          <BookingSummary
            business={booking.business!}
            startDate={booking.start_date}
            endDate={booking.end_date}
            guests={booking.guest_count}
            totalPrice={booking.total_amount}
            pricePerNight={booking.resource?.price_per_night}
          />
        </div>

        {/* Right Column: Payment Form */}
        <div>
          <StripeWrapper
            bookingId={booking.id}
            amount={booking.total_amount}
          />
        </div>
      </div>
    </div>
  )
}

