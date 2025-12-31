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
import { logger } from "@/lib/logger"
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
  const [activeTab, setActiveTab] = useState("overview")

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
      logger.log("Business Dashboard: Loading businesses")
      
      // First verify user is authenticated on client side
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        logger.error("Business Dashboard: User not authenticated", authError)
        toast.error("Sesiunea a expirat. Te rugăm să te autentifici din nou.")
        router.push("/auth/login?redirect=/business-portal/dashboard")
        return
      }
      
      logger.log("Business Dashboard: User authenticated", { userId: user.id })
      
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
      logger.log("Business Dashboard: Result", { success: result.success })
      
      // Handle both 'businesses' and 'data' response formats
      const businessesList = result.businesses || result.data || []
      
      if (result.success && businessesList.length > 0) {
        logger.log("Business Dashboard: Found businesses", { count: businessesList.length })
        setBusinesses(businessesList)
        setSelectedBusiness(businessesList[0])
        logger.log("Business Dashboard: Selected business", { name: businessesList[0].name })
      } else if (result.success && businessesList.length === 0) {
        // No businesses, redirect to onboarding
        logger.log("Business Dashboard: No businesses found, redirecting to onboarding")
        router.push("/business-portal/onboarding")
      } else {
        logger.error("Business Dashboard: Failed to load businesses", result.error)
        toast.error(result.error || "Failed to load businesses")
        // If not authenticated, redirect to login
        if (response.status === 401) {
          router.push("/auth/login?redirect=/business-portal/dashboard")
        } else {
          // User doesn't have businesses, redirect to home (they're a traveler)
          router.push("/home")
        }
      }
    } catch (error) {
      logger.error("Business Dashboard: Exception loading businesses", error)
      toast.error("Failed to load businesses")
      router.push("/business-portal/onboarding")
    } finally {
      setIsLoading(false)
    }
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-mova-blue" />
      </div>
    )
  }

  if (!selectedBusiness) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-mova-gray mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-mova-dark mb-2">
            Nu s-a găsit niciun business
          </h2>
          <p className="text-mova-gray mb-6">
            Creează primul tău business pentru a începe
          </p>
          <Button asChild>
            <Link href="/business-portal/onboarding">
              <Plus className="h-4 w-4 mr-2" />
              Creează Business
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-mova-light-gray w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar Navigation - Hidden on mobile, shown on desktop */}
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col min-h-screen flex-shrink-0">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-mova-dark">Portal Business</h1>
            <p className="text-sm text-mova-gray mt-1">{selectedBusiness?.name}</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-airbnb transition-colors ${
                activeTab === "overview"
                  ? "bg-mova-blue text-white"
                  : "hover:bg-mova-light-gray text-mova-dark"
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="font-medium">Prezentare</span>
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-airbnb transition-colors ${
                activeTab === "bookings"
                  ? "bg-mova-blue text-white"
                  : "hover:bg-mova-light-gray text-mova-dark"
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Rezervări</span>
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-airbnb transition-colors ${
                activeTab === "reviews"
                  ? "bg-mova-blue text-white"
                  : "hover:bg-mova-light-gray text-mova-dark"
              }`}
            >
              <Star className="h-5 w-5" />
              <span className="font-medium">Recenzii</span>
            </button>
            <button
              onClick={() => setActiveTab("resources")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-airbnb transition-colors ${
                activeTab === "resources"
                  ? "bg-mova-blue text-white"
                  : "hover:bg-mova-light-gray text-mova-dark"
              }`}
            >
              <Package className="h-5 w-5" />
              <span className="font-medium">Inventar</span>
            </button>
            <button
              onClick={() => setActiveTab("availability")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-airbnb transition-colors ${
                activeTab === "availability"
                  ? "bg-mova-blue text-white"
                  : "hover:bg-mova-light-gray text-mova-dark"
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Calendar</span>
            </button>
            <Link
              href="/business-portal/promote"
              className="flex items-center gap-3 px-4 py-3 rounded-airbnb hover:bg-mova-light-gray text-mova-dark transition-colors"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">Promovare</span>
            </Link>
          </nav>
          <div className="p-4 border-t border-gray-200">
            {businesses.length > 1 && (
              <select
                value={selectedBusiness?.id || ''}
                onChange={(e) => {
                  const business = businesses.find((b) => b.id === e.target.value)
                  if (business) setSelectedBusiness(business)
                }}
                className="w-full h-10 px-4 rounded-airbnb border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-mova-blue focus:border-mova-blue"
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
                Adaugă Business
              </Link>
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-4 md:py-8 px-4 md:px-8 w-full min-w-0">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
            {/* Main Content Tabs */}
            <Tabs value={activeTab || "overview"} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="overview" className="mt-0">
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

