"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import { Calendar, MapPin, DollarSign, Share2, Edit, Plus, Sparkles, ArrowLeft, Loader2 } from "lucide-react"
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

// Lazy load heavy trip components
const BudgetMeter = lazy(() => import("@/components/features/trip/budget-meter").then(m => ({ default: m.BudgetMeter })))
const TimelineView = lazy(() => import("@/components/features/trip/timeline-view").then(m => ({ default: m.TimelineView })))

type ViewMode = 'selector' | 'planner'

export default function PlanPage() {
  const {
    tripDetails,
    budget,
    items,
    spentBudget,
    getDaysCount,
    updateBudget,
    loadTripFromDatabase,
    initTrip,
  } = useTripStore()

  const {
    vacations,
    activeVacationId,
    selectVacation,
    getActiveVacation,
  } = useVacationStore()

  const { setCity } = useAppStore()

  const [viewMode, setViewMode] = useState<ViewMode>('selector')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false)
  const [isLoadingTrip, setIsLoadingTrip] = useState(false)

  // Check if we should go directly to planner (if there's an active vacation)
  useEffect(() => {
    if (activeVacationId && vacations.length > 0 && viewMode === 'selector') {
      const activeVacation = getActiveVacation()
      if (activeVacation) {
        // Load trip data for active vacation
        loadVacationTrip(activeVacation.id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVacationId, vacations.length])

  // Function to load trip data for a specific vacation
  const loadVacationTrip = async (vacationId: string) => {
    setIsLoadingTrip(true)

    try {
      const vacation = vacations.find(v => v.id === vacationId) || getActiveVacation()

      if (!vacation) {
        setIsLoadingTrip(false)
        return
      }

      // Initialize trip store with vacation data
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
        }
      )

      // Sync city with app store for Explore page
      const supabase = createClient()
      const { data: cityData } = await supabase
        .from('cities')
        .select('*')
        .eq('id', vacation.cityId)
        .single()

      if (cityData) {
        setCity(cityData)
      }

      // Load trip items from database
      await loadTripFromDatabase()

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
    setViewMode('selector')
  }

  // Loading trip state (VacationSelector handles its own loading state)
  if (isLoadingTrip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Se încarcă planificarea...</p>
      </div>
    )
  }

  // Vacation Selector View
  if (viewMode === 'selector') {
    return (
      <VacationSelector onVacationSelected={handleVacationSelected} />
    )
  }

  // Planner View - Empty State (no trip details)
  if (!tripDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <div className="h-24 w-24 rounded-airbnb-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/25">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Începe să-ți planifici călătoria
          </h2>
          <p className="text-gray-500 mb-8">
            Creează-ți itinerariul perfect, stabilește un buget și urmărește-ți cheltuielile într-un singur loc.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Începe o călătorie nouă
            </Button>
            <Button
              variant="outline"
              onClick={handleBackToSelector}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi la vacanțe
            </Button>
          </div>
        </div>

        <CreateTripDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    )
  }

  // Active Planner State
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
