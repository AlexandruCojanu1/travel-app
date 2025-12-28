"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getBusinessBookings, updateBookingStatus } from "@/actions/business-portal"
import { InventoryManager } from "@/components/features/business/portal/inventory-manager"
import { AvailabilityCalendarSelector } from "@/components/features/business/portal/availability-calendar-selector"
import { DashboardOverview } from "@/components/features/business/portal/dashboard-overview"
import { BookingsKanban } from "@/components/features/business/portal/bookings-kanban"
import { ReviewsReputation } from "@/components/features/business/portal/reviews-reputation"
import { Button } from "@/components/shared/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/ui/tabs"
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  Star, 
  Loader2,
  Plus,
  LayoutDashboard,
  MessageSquare,
  Package,
  TrendingUp
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Business {
  id: string
  name: string
  category: string
  type?: string
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Wait for page to fully load and cookies to be available
    const timer = setTimeout(() => {
      loadBusinesses()
    }, 500) // Increased delay to ensure cookies are propagated
    
    return () => clearTimeout(timer)
  }, [])

  const loadBusinesses = async () => {
    setIsLoading(true)
    try {
      console.log("Business Dashboard: Loading businesses...")
      
      // First verify user is authenticated on client side
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error("Business Dashboard: User not authenticated on client:", authError)
        toast.error("Sesiunea a expirat. Te rugăm să te autentifici din nou.")
        router.push("/auth/login?redirect=/business-portal/dashboard")
        return
      }
      
      console.log("Business Dashboard: User authenticated:", user.id)
      
      // Get session token to send with request
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      // Use API route instead of server action for better cookie handling
      const headers: HeadersInit = {
        'Cache-Control': 'no-cache',
      }
      
      // If we have a session token, send it as Authorization header as fallback
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }
      
      const response = await fetch('/api/business/list', {
        method: 'GET',
        credentials: 'include', // CRITICAL: Include cookies for session
        headers,
      })
      
      const result = await response.json()
      console.log("Business Dashboard: Result", result)
      
      if (result.success && result.businesses) {
        console.log("Business Dashboard: Found", result.businesses.length, "businesses")
        setBusinesses(result.businesses)
        if (result.businesses.length > 0) {
          setSelectedBusiness(result.businesses[0])
          console.log("Business Dashboard: Selected business", result.businesses[0].name)
        } else {
          // No businesses, redirect to onboarding
          console.log("Business Dashboard: No businesses found, redirecting to onboarding")
          router.push("/business-portal/onboarding")
        }
      } else {
        console.error("Business Dashboard: Failed to load businesses", result.error)
        toast.error(result.error || "Failed to load businesses")
        // If not authenticated, redirect to login
        if (response.status === 401) {
          router.push("/auth/login?redirect=/business-portal/dashboard")
        } else {
          router.push("/business-portal/onboarding")
        }
      }
    } catch (error) {
      console.error("Business Dashboard: Exception loading businesses", error)
      toast.error("Failed to load businesses")
      router.push("/business-portal/onboarding")
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

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar Navigation - Hidden on mobile, shown on desktop */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col min-h-screen flex-shrink-0">
          <div className="p-6 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-900">Business Portal</h1>
            <p className="text-sm text-slate-600 mt-1">{selectedBusiness?.name}</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link
              href="#overview"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="font-medium">Overview</span>
            </Link>
            <Link
              href="#bookings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Bookings</span>
            </Link>
            <Link
              href="#reviews"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              <Star className="h-5 w-5" />
              <span className="font-medium">Reviews</span>
            </Link>
            <Link
              href="#resources"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              <Package className="h-5 w-5" />
              <span className="font-medium">Inventory</span>
            </Link>
            <Link
              href="/business-portal/promote"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">Promote</span>
            </Link>
          </nav>
          <div className="p-4 border-t border-slate-200">
            {businesses.length > 1 && (
              <select
                value={selectedBusiness?.id || ''}
                onChange={(e) => {
                  const business = businesses.find((b) => b.id === e.target.value)
                  if (business) setSelectedBusiness(business)
                }}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <Button variant="outline" className="w-full mt-3" asChild>
              <Link href="/business-portal/onboarding">
                <Plus className="h-4 w-4 mr-2" />
                Add Business
              </Link>
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-4 md:py-8 px-4 md:px-8 w-full min-w-0">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-slate-900 truncate">Business Portal</h1>
                <p className="text-sm text-slate-600 truncate">{selectedBusiness?.name}</p>
              </div>
              <Button variant="outline" size="sm" className="ml-2 flex-shrink-0" asChild>
                <Link href="/business-portal/onboarding">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-4 md:mb-6 h-auto">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="bookings" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Bookings</span>
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">Reviews</span>
                </TabsTrigger>
                <TabsTrigger value="resources" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Inventory</span>
                </TabsTrigger>
                <TabsTrigger value="availability" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                {selectedBusiness && (
                  <DashboardOverview businessId={selectedBusiness.id} />
                )}
              </TabsContent>

              <TabsContent value="bookings" className="mt-6">
                {selectedBusiness && (
                  <BookingsKanban businessId={selectedBusiness.id} />
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                {selectedBusiness && (
                  <ReviewsReputation businessId={selectedBusiness.id} />
                )}
              </TabsContent>

              <TabsContent value="resources" className="mt-6">
                {selectedBusiness && (
                  <InventoryManager 
                    businessId={selectedBusiness.id} 
                    businessType={selectedBusiness.type || selectedBusiness.category} 
                  />
                )}
              </TabsContent>

              <TabsContent value="availability" className="mt-6">
                {selectedBusiness && (
                  <AvailabilityCalendarSelector businessId={selectedBusiness.id} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

