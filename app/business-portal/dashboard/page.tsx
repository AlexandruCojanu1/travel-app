"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getUserBusinesses, getBusinessBookings, updateBookingStatus } from "@/actions/business-portal"
import { ResourceManager } from "@/components/business-portal/resource-manager"
import { AvailabilityCalendarSelector } from "@/components/business-portal/availability-calendar-selector"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  Star, 
  Check, 
  X, 
  Loader2,
  Plus,
  Settings
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useTransition } from "react"
import Link from "next/link"

interface Business {
  id: string
  name: string
  category: string
  rating: number | null
  is_verified: boolean
}

interface Booking {
  id: string
  start_date: string
  end_date: string
  guest_count: number
  total_amount: number
  status: string
  created_at: string
  user?: {
    full_name: string
    email: string
  }
  resource?: {
    name: string
  }
}

export default function BusinessPortalDashboard() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState({
    totalBookings: 0,
    revenueThisMonth: 0,
    rating: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    loadBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusiness) {
      loadBookings()
      loadStats()
    }
  }, [selectedBusiness])

  const loadBusinesses = async () => {
    setIsLoading(true)
    try {
      const result = await getUserBusinesses()
      if (result.success && result.businesses) {
        setBusinesses(result.businesses)
        if (result.businesses.length > 0) {
          setSelectedBusiness(result.businesses[0])
        } else {
          // No businesses, redirect to onboarding
          router.push("/business-portal/onboarding")
        }
      } else {
        toast.error(result.error || "Failed to load businesses")
        router.push("/business-portal/onboarding")
      }
    } catch (error) {
      console.error("Error loading businesses:", error)
      toast.error("Failed to load businesses")
      router.push("/business-portal/onboarding")
    } finally {
      setIsLoading(false)
    }
  }

  const loadBookings = async () => {
    if (!selectedBusiness) return

    try {
      const result = await getBusinessBookings(selectedBusiness.id)
      if (result.success && result.bookings) {
        setBookings(result.bookings)
      }
    } catch (error) {
      console.error("Error loading bookings:", error)
    }
  }

  const loadStats = async () => {
    if (!selectedBusiness) return

    try {
      const supabase = createClient()
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      // Total bookings
      const { count: totalCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("business_id", selectedBusiness.id)

      // Revenue this month
      const { data: monthBookings } = await supabase
        .from("bookings")
        .select("total_amount")
        .eq("business_id", selectedBusiness.id)
        .eq("status", "confirmed")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString())

      const revenue = monthBookings?.reduce((sum, b) => sum + parseFloat(b.total_amount.toString()), 0) || 0

      setStats({
        totalBookings: totalCount || 0,
        revenueThisMonth: revenue,
        rating: selectedBusiness.rating || 0,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const handleBookingAction = async (bookingId: string, status: "confirmed" | "cancelled") => {
    startTransition(async () => {
      const result = await updateBookingStatus(bookingId, status)
      if (result.success) {
        toast.success(`Booking ${status === "confirmed" ? "accepted" : "rejected"}`)
        loadBookings()
        loadStats()
      } else {
        toast.error(result.error || "Failed to update booking")
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!selectedBusiness) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            No Business Found
          </h2>
          <p className="text-slate-600 mb-6">
            Create your first business to get started
          </p>
          <Button asChild>
            <Link href="/business-portal/onboarding">
              <Plus className="h-4 w-4 mr-2" />
              Create Business
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const pendingBookings = bookings.filter((b) => b.status === "awaiting_payment")
  const recentBookings = bookings.slice(0, 10)

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Business Portal</h1>
            <p className="text-slate-600 mt-1">{selectedBusiness.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {businesses.length > 1 && (
              <select
                value={selectedBusiness.id}
                onChange={(e) => {
                  const business = businesses.find((b) => b.id === e.target.value)
                  if (business) setSelectedBusiness(business)
                }}
                className="h-10 px-4 rounded-md border border-input bg-background"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <Button variant="outline" asChild>
              <Link href="/business-portal/onboarding">
                <Plus className="h-4 w-4 mr-2" />
                Add Business
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Total Bookings</span>
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {stats.totalBookings}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Revenue (This Month)</span>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {stats.revenueThisMonth.toFixed(2)} RON
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Rating</span>
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {stats.rating.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Recent Bookings</h2>
              </div>
              {recentBookings.length === 0 ? (
                <div className="p-12 text-center text-slate-600">
                  <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p>No bookings yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Resource
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Dates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Guests
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {recentBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-slate-900">
                                {booking.user?.full_name || "Guest"}
                              </div>
                              <div className="text-sm text-slate-600">
                                {booking.user?.email || ""}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-900">
                            {booking.resource?.name || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-slate-900">
                            <div className="text-sm">
                              {format(new Date(booking.start_date), "MMM dd")} -{" "}
                              {format(new Date(booking.end_date), "MMM dd, yyyy")}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-900">
                            {booking.guest_count}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {parseFloat(booking.total_amount.toString()).toFixed(2)} RON
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                booking.status === "confirmed"
                                  ? "bg-green-100 text-green-700"
                                  : booking.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {booking.status.charAt(0).toUpperCase() +
                                booking.status.slice(1).replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {booking.status === "awaiting_payment" && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleBookingAction(booking.id, "confirmed")
                                  }
                                  disabled={isPending}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleBookingAction(booking.id, "cancelled")
                                  }
                                  disabled={isPending}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <ResourceManager businessId={selectedBusiness.id} />
          </TabsContent>

          <TabsContent value="availability" className="mt-6">
            <AvailabilityCalendarSelector businessId={selectedBusiness.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

