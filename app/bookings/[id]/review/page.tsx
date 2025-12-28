"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CreateReviewDialog } from '@/components/features/reviews/create-review-dialog'
import { Loader2 } from 'lucide-react'

export default function ReviewBookingPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasReviewed, setHasReviewed] = useState(false)

  useEffect(() => {
    loadBookingData()
  }, [bookingId])

  async function loadBookingData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      // Load booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          business:businesses (
            id,
            name,
            category
          )
        `)
        .eq('id', bookingId)
        .eq('user_id', user.id)
        .single()

      if (bookingError || !bookingData) {
        router.push('/bookings')
        return
      }

      if (bookingData.status !== 'confirmed') {
        router.push(`/bookings/${bookingId}`)
        return
      }

      setBooking(bookingData)
      setBusiness(bookingData.business)

      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', bookingData.business.id)
        .single()

      setHasReviewed(!!existingReview)
    } catch (error) {
      console.error('Error loading booking:', error)
      router.push('/bookings')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!booking || !business) {
    return null
  }

  if (hasReviewed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Review Already Submitted</h1>
          <p className="text-gray-600 mb-6">
            You have already reviewed this business.
          </p>
          <button
            onClick={() => router.push(`/bookings/${bookingId}`)}
            className="text-blue-600 hover:underline"
          >
            Back to Booking
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Write a Review</h1>
        <p className="text-gray-600 mb-8">
          Share your experience with {business.name}
        </p>

        <CreateReviewDialog
          isOpen={true}
          onOpenChange={(open) => {
            if (!open) {
              router.push(`/bookings/${bookingId}`)
            }
          }}
          businessId={business.id}
          businessName={business.name}
          bookingId={bookingId}
        />
      </div>
    </div>
  )
}

