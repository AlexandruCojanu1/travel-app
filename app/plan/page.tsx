"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import { useSearchParams } from "next/navigation"
import { Calendar, MapPin, DollarSign, Share2, Edit, Plus, Sparkles, ArrowLeft, Loader2, Trash2 } from "lucide-react"
import { useTripStore } from "@/store/trip-store"
import { useVacationStore } from "@/store/vacation-store"
import { useAppStore } from "@/store/app-store"
import { VacationSelector } from "@/components/features/vacation/vacation-selector"
import { CreateTripDialog } from "@/components/features/trip/create-trip-dialog"
import { SyncIndicator } from "@/components/features/trip/sync-indicator"
import { Button } from "@/components/shared/ui/button"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { useUIStore } from "@/store/ui-store"
import { HomeHeader } from "@/components/features/feed/home-header"
import { TravelGuideCard } from "@/components/features/feed/travel-guide-card"
import { TripSummaryCard } from "@/components/features/feed/trip-summary-card"
import { getCityFeed } from "@/services/feed/feed.service"

// Lazy load heavy trip components
const BudgetMeter = lazy(() => import("@/components/features/trip/budget-meter").then(m => ({ default: m.BudgetMeter })))
const TimelineView = lazy(() => import("@/components/features/trip/timeline-view").then(m => ({ default: m.TimelineView })))

type ViewMode = 'selector' | 'planner'

export default function PlanPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-600">Se încarcă planificarea...</p>
      </div>
    }>
      <PlanPageContent />
    </Suspense>
  )
}

function PlanPageContent() {
  const searchParams = useSearchParams()
  const action = searchParams.get('action')

  const {
    tripDetails,
    budget,
    items,
    spentBudget,
    getDaysCount,
    updateBudget,
    loadTripFromDatabase,
    initTrip,
    deleteCurrentTrip,
    tripId,
  } = useTripStore()

  const handleDeleteTrip = async () => {
    if (window.confirm('Ești sigur că vrei să ștergi acest plan? Această acțiune este ireversibilă.')) {
      await deleteCurrentTrip()
      setViewMode('selector')
    }
  }

  const {
    vacations,
    activeVacationId,
    selectVacation,
    getActiveVacation,
    clearActiveVacation,
  } = useVacationStore()

  const { setCity } = useAppStore()
  const { openBusinessDrawer } = useUIStore()

  const [viewMode, setViewMode] = useState<ViewMode>('selector')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false)
  const [isLoadingTrip, setIsLoadingTrip] = useState(false)

  const [profile, setProfile] = useState<{ avatar_url: string | null; full_name: string | null } | null>(null)
  const [feedData, setFeedData] = useState<any>(null)

  // Handle action parameter on mount
  useEffect(() => {
    if (action === 'new') {
      setIsCreateDialogOpen(true)
    }
  }, [action])

  // Load profile and feed data
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('id', user.id)
          .single()
        if (profileData) setProfile(profileData)

        const feed = await getCityFeed(user.id) // Or use a default city ID
        setFeedData(feed)
      }
    }
    loadData()
  }, [])

  // Check if we should go directly to planner (if there's an active vacation)
  useEffect(() => {
    if (activeVacationId && vacations.length > 0) {
      // If we are not in planner OR if we are but looking at wrong trip
      if (viewMode === 'selector' || (tripId && tripId !== activeVacationId)) {
        const activeVacation = getActiveVacation()
        if (activeVacation) {
          loadVacationTrip(activeVacation.id)
        }
      }
    }
  }, [activeVacationId, vacations.length, viewMode, tripId])

  // Function to load trip data for a specific vacation
  const loadVacationTrip = async (vacationId: string) => {
    setIsLoadingTrip(true)
    try {
      const vacation = vacations.find(v => v.id === vacationId) || getActiveVacation()
      if (!vacation) {
        setIsLoadingTrip(false)
        return
      }

      initTrip(
        {
          cityId: vacation.cityId,
          cityName: vacation.cityName,
          startDate: vacation.startDate,
          endDate: vacation.endDate,
          title: vacation.title,
        },
        {
          total: vacation.budgetTotal,
          currency: vacation.currency,
        },
        vacation.id
      )

      const supabase = createClient()
      const { data: cityData } = await supabase
        .from('cities')
        .select('*')
        .eq('id', vacation.cityId)
        .single()

      if (cityData) setCity(cityData)
      await loadTripFromDatabase(vacation.id)
      setViewMode('planner')
    } catch (error) {
      console.error('Error loading vacation trip:', error)
    } finally {
      setIsLoadingTrip(false)
    }
  }

  // Handle vacation selection from selector
  const handleVacationSelected = (vacationId: string) => {
    loadVacationTrip(vacationId)
  }

  // Handle going back to selector
  const handleBackToSelector = () => {
    clearActiveVacation()
    setViewMode('selector')
  }

  if (isLoadingTrip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Se încarcă planificarea...</p>
      </div>
    )
  }

  // Dashboard View (Selector)
  if (viewMode === 'selector') {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-12 space-y-12 pb-32 pt-6">


        {/* My Trips */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#A4A4A4]">Călătoriile mele</h2>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="p-2 bg-secondary/50 rounded-full text-primary hover:bg-secondary transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
            {vacations.length > 0 ? (
              vacations.map((vacation) => (
                <TripSummaryCard
                  key={vacation.id}
                  title={vacation.title}
                  startDate={vacation.startDate}
                  endDate={vacation.endDate}
                  spotsCount={vacation.spotsCount}
                  imageUrl={vacation.coverImage}
                  onClick={() => handleVacationSelected(vacation.id)}
                />
              ))
            ) : (
              <div
                onClick={() => setIsCreateDialogOpen(true)}
                className="col-span-full p-16 border-2 border-dashed border-slate-200 rounded-[32px] text-center cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <p className="text-slate-400 font-medium">Nu ai nicio călătorie planificată.</p>
                <p className="text-primary font-bold mt-2">Creează una nouă!</p>
              </div>
            )}
          </div>
        </section>

        <CreateTripDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    )
  }

  // Planner View
  if (!tripDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Se inițializează planificarea...</p>
      </div>
    )
  }

  const daysCount = getDaysCount()
  const spent = spentBudget()
  const placesCount = items.length
  const activeVacation = getActiveVacation()

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 space-y-6 pb-8">
      {/* Back Button & Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={handleBackToSelector}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Toate vacanțele
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {activeVacation?.title || `Călătorie la ${tripDetails.cityName || 'Destinația ta'}`}
          </h1>
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {tripDetails.startDate &&
                  format(new Date(tripDetails.startDate), "d MMM", { locale: ro })}
                {" - "}
                {tripDetails.endDate &&
                  format(new Date(tripDetails.endDate), "d MMM yyyy", { locale: ro })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{tripDetails.cityName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SyncIndicator />
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Distribuie</span>
          </Button>
        </div>
      </div>

      {/* Budget Meter Hero Widget */}
      {budget && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <Suspense fallback={
            <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          }>
            <BudgetMeter />
          </Suspense>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-500">Locuri</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{placesCount}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-500">Zile</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{daysCount}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-500">Cheltuit</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {spent.toFixed(0)} {budget?.currency || 'RON'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-500">Rămas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {budget
              ? (budget.total - spent).toFixed(0)
              : 0}{" "}
            {budget?.currency || 'RON'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => setIsEditBudgetOpen(true)}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Editează bugetul
        </Button>
        <Button
          variant="outline"
          onClick={handleDeleteTrip}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          <Trash2 className="h-4 w-4" />
          Șterge
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Distribuie planul
        </Button>
      </div>

      {/* Timeline View */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Itinerar</h2>
        <Suspense fallback={
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        }>
          <TimelineView />
        </Suspense>
      </div>

      {/* Edit Budget Dialog (Simple) */}
      {isEditBudgetOpen && budget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Editează bugetul</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buget: {budget.total.toLocaleString()} {budget.currency}
                </label>
                <input
                  type="number"
                  min="500"
                  max="100000"
                  step="100"
                  value={budget.total}
                  onChange={(e) => updateBudget(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditBudgetOpen(false)}
                >
                  Anulează
                </Button>
                <Button
                  onClick={() => setIsEditBudgetOpen(false)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  Salvează
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CreateTripDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}
