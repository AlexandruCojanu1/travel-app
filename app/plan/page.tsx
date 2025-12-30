"use client"

import { useState, useEffect } from "react"
import { Calendar, MapPin, DollarSign, Share2, Edit, Plus, Sparkles } from "lucide-react"
import { useTripStore } from "@/store/trip-store"
import { BudgetMeter } from "@/components/features/trip/budget-meter"
import { TimelineView } from "@/components/features/trip/timeline-view"
import { CreateTripDialog } from "@/components/features/trip/create-trip-dialog"
import { SyncIndicator } from "@/components/features/trip/sync-indicator"
import { Button } from "@/components/shared/ui/button"
import { format } from "date-fns"

export default function PlanPage() {
  const {
    tripDetails,
    budget,
    items,
    spentBudget,
    getDaysCount,
    updateBudget,
    loadTripFromDatabase,
  } = useTripStore()

  // Load trip from database on mount, but only if we don't have items locally
  // This prevents overwriting items that were just added but not yet synced
  useEffect(() => {
    const state = useTripStore.getState()
    // Only load from database if we don't have items or trip details
    // This prevents race condition where items are added but not yet synced
    if (!state.items.length || !state.tripDetails) {
      loadTripFromDatabase()
    }
  }, [loadTripFromDatabase])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false)

  // Empty State
  if (!tripDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <div className="h-24 w-24 rounded-airbnb-lg bg-mova-blue flex items-center justify-center mx-auto mb-6 shadow-airbnb-lg">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-mova-dark mb-3">
            Începe să-ți planifici călătoria
          </h2>
          <p className="text-mova-gray mb-8">
            Creează-ți itinerariul perfect, stabilește un buget și urmărește-ți cheltuielile într-un singur loc.
          </p>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            size="lg"
            className="airbnb-button px-8 py-6 text-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Începe o călătorie nouă
          </Button>
        </div>

        <CreateTripDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    )
  }

  // Active State
  const daysCount = getDaysCount()
  const spent = spentBudget()
  const placesCount = items.length

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Călătorie la {tripDetails.cityName || 'Destinația ta'}
          </h1>
          <div className="flex items-center gap-4 text-slate-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {tripDetails.startDate &&
                  format(new Date(tripDetails.startDate), "MMM d")}
                {" - "}
                {tripDetails.endDate &&
                  format(new Date(tripDetails.endDate), "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{daysCount} zile</span>
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
        <div className="airbnb-card p-6">
          <BudgetMeter />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="airbnb-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-mova-blue" />
            <span className="text-sm font-medium text-mova-gray">Locuri</span>
          </div>
          <p className="text-2xl font-bold text-mova-dark">{placesCount}</p>
        </div>

        <div className="airbnb-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-mova-gray">Zile</span>
          </div>
          <p className="text-2xl font-bold text-mova-dark">{daysCount}</p>
        </div>

        <div className="airbnb-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-mova-gray">Cheltuit</span>
          </div>
          <p className="text-2xl font-bold text-mova-dark">
            {spent.toFixed(0)} {budget?.currency || 'RON'}
          </p>
        </div>

        <div className="airbnb-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-mova-gray">Rămas</span>
          </div>
          <p className="text-2xl font-bold text-mova-dark">
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
        <h2 className="text-xl font-bold text-mova-dark mb-4">Itinerar</h2>
        <TimelineView />
      </div>

      {/* Edit Budget Dialog (Simple) */}
      {isEditBudgetOpen && budget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-airbnb-lg p-6 max-w-md w-full mx-4 shadow-airbnb-lg border border-gray-200">
            <h3 className="text-lg font-bold text-mova-dark mb-4">Editează bugetul</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-mova-dark mb-2">
                  Buget: {budget.total.toLocaleString()} {budget.currency}
                </label>
                <input
                  type="number"
                  min="500"
                  max="100000"
                  step="100"
                  value={budget.total}
                  onChange={(e) => updateBudget(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-airbnb focus:ring-2 focus:ring-mova-blue focus:border-mova-blue"
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
                  className="airbnb-button"
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
