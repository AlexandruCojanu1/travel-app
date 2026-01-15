"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar, MapPin, CheckCircle2, XCircle, Clock, BookCheck, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { logger } from "@/lib/logger"
import { Button } from "@/components/shared/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/shared/ui/dialog"
import Image from "next/image"
import { useRouter } from "next/navigation"

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
    business?: {
        name: string
        image_url?: string
        city_id?: string
    }
}

interface BookingsDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function BookingsDialog({ isOpen, onOpenChange }: BookingsDialogProps) {
    const router = useRouter()
    const [bookings, setBookings] = useState<Booking[]>([])
    const [plannedHotels, setPlannedHotels] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            loadBookings()
        }
    }, [isOpen])

    async function loadBookings() {
        setIsLoading(true)
        setError(null)
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
                .select("*, business:businesses(*)")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })

            if (bookingsError) {
                logger.error("Error loading bookings", bookingsError)
                setError("Failed to load bookings.")
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
                            if (item.business && item.business.category?.toLowerCase().includes('hotel')) {
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

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <BookCheck className="h-6 w-6 text-primary" />
                        Rezervările mele
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Se încarcă rezervările...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-destructive mb-4">{error}</p>
                        <Button onClick={loadBookings}>Reîncearcă</Button>
                    </div>
                ) : (
                    <div className="space-y-8 py-4">

                        {/* Planned Stays Section */}
                        {plannedHotels.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                                        <Calendar className="h-4 w-4" />
                                    </span>
                                    Planificate (Saved in Trips)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {plannedHotels.map((item, index) => (
                                        <div key={`${item.id}-${index}`} className="flex gap-4 p-3 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                                            <div className="relative h-24 w-24 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                                {item.business.image_url ? (
                                                    <Image
                                                        src={item.business.image_url}
                                                        alt={item.business.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-2xl">🏨</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 truncate">{item.business.name}</h4>
                                                <p className="text-xs text-gray-500 mb-2 truncate">
                                                    {item.trip_title}
                                                </p>
                                                <p className="text-xs font-medium text-blue-600 mb-2">
                                                    {item.start_date ? format(new Date(item.start_date), "MMM d") : 'TBD'}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    className="h-8 text-xs w-full sm:w-auto"
                                                    onClick={() => {
                                                        onOpenChange(false)
                                                        router.push(`/explore?city_id=${item.business.city_id}&business_id=${item.business.id}&action=book`)
                                                    }}
                                                >
                                                    Book Now
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Confirmed Bookings Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="bg-green-100 text-green-600 p-1.5 rounded-lg">
                                    <CheckCircle2 className="h-4 w-4" />
                                </span>
                                Confirmate
                            </h3>

                            {bookings.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
                                    <p className="text-gray-500 text-sm">Nu există rezervări confirmate.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {bookings.map((booking) => (
                                        <div
                                            key={booking.id}
                                            className="flex gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-primary/20 transition-colors"
                                        >
                                            <div className="relative h-20 w-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                                {booking.business?.image_url ? (
                                                    <Image
                                                        src={booking.business.image_url}
                                                        alt={booking.business.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-2xl">🏨</div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{booking.business?.name}</h4>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                            {booking.status === "confirmed" ? (
                                                                <span className="text-green-600 flex items-center gap-1 font-medium"><CheckCircle2 className="h-3 w-3" /> Confirmed</span>
                                                            ) : (
                                                                <span className="text-yellow-600 flex items-center gap-1 font-medium"><Clock className="h-3 w-3" /> {booking.status}</span>
                                                            )}
                                                            <span>•</span>
                                                            <span>{booking.total_amount?.toLocaleString()} RON</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {format(new Date(booking.start_date), "MMM d")} - {format(new Date(booking.end_date), "MMM d, yyyy")}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
