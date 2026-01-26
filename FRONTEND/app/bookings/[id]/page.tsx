"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { MapPin, Download, X, ArrowLeft, Calendar, Users, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/ui/button'
import { BookingChatButton } from '@/components/features/messaging/booking-chat-button'
import { format } from 'date-fns'
import type { Booking } from '@/actions/booking'

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

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

        // Use backend API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const authToken = session?.access_token

        const response = await fetch(`${apiUrl}/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch booking')
        }

        const result = await response.json()

        if (!result) {
          setError('Booking not found')
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
  }, [bookingId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin border-4 border-mova-blue border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-mova-gray">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full airbnb-card border-red-200 p-6">
          <h3 className="text-lg font-semibold text-mova-dark mb-2">
            Booking Not Found
          </h3>
          <p className="text-sm text-mova-gray mb-4">{error}</p>
          <Button onClick={() => router.push('/bookings')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
        </div>
      </div>
    )
  }

  // Calculate nights
  const start = new Date(booking.check_in)
  const end = new Date(booking.check_out)
  const nights = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Check if booking can be cancelled (48h before start)
  const now = new Date()
  const startDate = new Date(booking.check_in)
  const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  const canCancel = hoursUntilStart > 48 && booking.status === 'confirmed'

  // Generate QR code data
  const qrData = JSON.stringify({
    bookingId: booking.id,
    businessName: booking.business?.name,
    startDate: booking.check_in,
    endDate: booking.check_out,
  })

  // Get directions URL
  const getDirectionsUrl = () => {
    // This would use the business address if available
    // For now, using a placeholder
    const businessName = booking.business?.name || ''
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}`
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      // Use backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      const response = await fetch(`${apiUrl}/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ reason: 'User requested cancellation' }),
      })

      const result = await response.json()

      if (!result.success) {
        alert(result.error || 'Failed to cancel booking')
        return
      }

      alert('Booking cancelled successfully')
      router.push('/bookings')
    } catch (err: any) {
      console.error('Error cancelling booking:', err)
      alert('Failed to cancel booking')
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      // Use backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      const response = await fetch(`${apiUrl}/bookings/invoice?bookingId=${booking.id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        alert('Failed to generate invoice')
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${booking.id.slice(0, 8)}.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      console.error('Error downloading invoice:', err)
      alert('Failed to download invoice')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Button
          onClick={() => router.push('/bookings')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>
      </div>

      {/* Voucher Card */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header: Business Image */}
          {booking.business?.image_url && (
            <div className="relative w-full h-64 md:h-80 bg-gray-100">
              <Image
                src={booking.business.image_url}
                alt={booking.business.name || 'Business'}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {booking.business.name}
                </h1>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8 space-y-8">
            {/* Booking Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Check-in / Check-out</p>
                  <p className="font-semibold text-gray-900">
                    {format(start, 'MMM d, yyyy')} - {format(end, 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {nights} {nights === 1 ? 'night' : 'nights'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Guests</p>
                  <p className="font-semibold text-gray-900">
                    {booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
              <div className="inline-block bg-white p-4 rounded-lg mb-4">
                <QRCodeSVG
                  value={qrData}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Show this at reception
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Booking ID: {booking.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            {/* Price Summary */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Total Amount</span>
                <span className="text-2xl font-bold text-gray-900">
                  {booking.total_price.toFixed(2)} RON
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Status</span>
                <span className={`font-semibold ${booking.status === 'confirmed' ? 'text-green-600' :
                  booking.status === 'cancelled' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {booking.status === 'confirmed' && (
                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                  onClick={() => router.push(`/bookings/${bookingId}/review`)}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Write Review
                </Button>
              )}

              {booking.business && (
                <BookingChatButton
                  bookingId={bookingId}
                  businessId={booking.business_id}
                  businessName={booking.business.name}
                />
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(getDirectionsUrl(), '_blank')}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Get Directions
              </Button>

              {canCancel && (
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-blue-50"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={handleDownloadInvoice}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

