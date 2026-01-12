"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Calendar, MapPin, Clock, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { logger } from "@/lib/logger"
import { Button } from "@/components/shared/ui/button"

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
  const [plannedHotels, setPlannedHotels] = useState<any[]>([])
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

        // Fetch confirmed bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("hotel_bookings")
          .select("*, business:businesses(*)") // Join businesses to get name/image
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (bookingsError) {
          logger.error("Error loading bookings", bookingsError)
          setError("Failed to load bookings. Please try again.")
        } else {
          setBookings(bookingsData || [])
        }

        // Fetch planned hotels from trips
        const { data: tripsData, error: tripsError } = await supabase
          .from("trips")
          .select(`
            *,
            items:trip_items(
              *,
              business:businesses(*)
            )
          `)
          .eq("user_id", user.id)
          .eq("status", "planning")
          .order("created_at", { ascending: false })

        if (!tripsError && tripsData) {
          const hotels: any[] = []
          tripsData.forEach((trip: any) => {
            if (trip.items) {
              trip.items.forEach((item: any) => {
                if (item.business && item.business.category.toLowerCase().includes('hotel')) {
                  // Check if this hotel is already booked (avoid duplicates if booked)
                  const isBooked = bookingsData?.some(b => b.business_id === item.business.id)
                  if (!isBooked) {
                    hotels.push({
                      ...item,
                      trip_title: trip.title,
                      trip_id: trip.id,
                      start_date: trip.start_date,
                      end_date: trip.end_date
                    })
                  }
                }
              })
            }
          })
          setPlannedHotels(hotels)
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
          <div className="h-8 w-8 animate-spin border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-muted-foreground bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Loading bookings...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => router.refresh()}
            className="bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all inline-block px-6 py-3"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 space-y-8 pb-8">
      {/* Planned Stays Section */}
      {plannedHotels.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <Calendar className="h-5 w-5" />
            </span>
            Planned Stays
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plannedHotels.map((item, index) => (
              <div key={`${item.id}-${index}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-48 w-full bg-gray-200">
                  {/* Reuse image logic or placeholder */}
                  {item.business.image_url ? (
                    <img src={item.business.image_url} alt={item.business.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🏨</div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-blue-600 shadow-sm">
                    Planned
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">{item.business.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {item.trip_title}
                  </p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                    <div className="text-sm">
                      <span className="block text-gray-400 text-xs">Dates</span>
                      <span className="font-medium text-gray-700">
                        {item.start_date ? format(new Date(item.start_date), "MMM d") : 'TBD'}
                      </span>
                    </div>
                    <Button
                      className="bg-black text-white hover:bg-gray-800 rounded-xl px-5"
                      onClick={() => {
                        // For now redirect to explore, ideally open booking drawer
                        router.push(`/explore?city_id=${item.business.city_id}&business_id=${item.business.id}&action=book`)
                      }}
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Bookings Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="bg-green-100 text-green-600 p-2 rounded-lg">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          Confirmed Bookings
        </h2>

        {bookings.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
            <p className="text-gray-500">No confirmed bookings yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking: any) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="block bg-card rounded-xl shadow-lg border border-border p-6 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {booking.status === "confirmed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : booking.status === "cancelled" ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                      <span className="text-sm font-semibold text-foreground capitalize">
                        {booking.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {booking.business?.name || `Booking #${booking.id.slice(0, 8)}`}
                    </h3>
                    {booking.start_date && booking.end_date && (
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {format(new Date(booking.start_date), "MMM d")} -{" "}
                          {format(new Date(booking.end_date), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                    {booking.total_amount && (
                      <p className="text-lg font-bold text-foreground">
                        {booking.total_amount.toLocaleString()} RON
                      </p>
                    )}
                  </div>
                  {booking.business?.image_url && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 ml-4">
                      <img src={booking.business.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


