"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar, MapPin, Clock, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadBookings() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error loading bookings:", error)
        } else {
          setBookings(data || [])
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBookings()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-mova-gray">Loading bookings...</div>
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


