"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Calendar, MapPin, Clock, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { logger } from "@/lib/logger"

interface Booking {
  id: string
  user_id: string
  business_id: string
  resource_id: string
  start_date: string
  end_date: string
  guest_count: number
  total_amount: number
  status: string
  created_at: string
  updated_at: string
}

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBookings() {
      try {
        const supabase = createClient()
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setError("Please log in to view your bookings")
          setIsLoading(false)
          return
        }

        const { data, error: bookingsError } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (bookingsError) {
          logger.error("Error loading bookings", bookingsError)
          setError("Failed to load bookings. Please try again.")
        } else {
          setBookings(data || [])
        }
      } catch (err) {
        logger.error("Error loading bookings", err)
        setError("An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    loadBookings()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin border-4 border-mova-blue border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-mova-gray">Loading bookings...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-mova-dark mb-2">Error</h2>
          <p className="text-mova-gray mb-6">{error}</p>
          <button
            onClick={() => router.refresh()}
            className="airbnb-button inline-block px-6 py-3"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <Calendar className="h-16 w-16 text-mova-gray mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-mova-dark mb-2">No Bookings Yet</h2>
          <p className="text-mova-gray mb-6">
            Start exploring and book your first experience!
          </p>
          <Link
            href="/explore"
            className="airbnb-button inline-block px-6 py-3"
          >
            Explore Now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 space-y-4 pb-8">
      <h1 className="text-3xl font-bold text-mova-dark mb-6">My Bookings</h1>
      {bookings.map((booking) => (
        <Link
          key={booking.id}
          href={`/bookings/${booking.id}`}
          className="block airbnb-card p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {booking.status === "confirmed" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : booking.status === "cancelled" ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                <span className="text-sm font-semibold text-mova-dark capitalize">
                  {booking.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-mova-dark mb-2">
                Booking #{booking.id.slice(0, 8)}
              </h3>
              {booking.start_date && booking.end_date && (
                <div className="flex items-center gap-2 text-mova-gray mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {format(new Date(booking.start_date), "MMM d")} -{" "}
                    {format(new Date(booking.end_date), "MMM d, yyyy")}
                  </span>
                </div>
              )}
              {booking.total_amount && (
                <p className="text-lg font-bold text-mova-dark">
                  {booking.total_amount.toLocaleString()} RON
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}


