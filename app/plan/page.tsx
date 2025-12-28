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

  // Load trip from database on mount
  useEffect(() => {
    loadTripFromDatabase()
  }, [loadTripFromDatabase])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false)

  // Empty State
  if (!tripDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/25">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Start Planning Your Trip
          </h2>
          <p className="text-slate-600 mb-8">
            Create your perfect itinerary, set a budget, and track your spending all in one place.
          </p>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-6 text-lg font-semibold"
          >
            <Plus className="h-5 w-5 mr-2" />
            Start a New Trip
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
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Trip to {tripDetails.cityName || 'Your Destination'}
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
              <span className="text-sm">{daysCount} days</span>
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
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>

      {/* Budget Meter Hero Widget */}
      {budget && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <BudgetMeter />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Places</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{placesCount}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Days</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{daysCount}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Spent</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {spent.toFixed(0)} {budget?.currency || 'RON'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">Remaining</span>
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
          Edit Budget
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share Plan
        </Button>
      </div>

      {/* Timeline View */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Itinerary</h2>
        <TimelineView />
      </div>

      {/* Edit Budget Dialog (Simple) */}
      {isEditBudgetOpen && budget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Budget</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget: {budget.total.toLocaleString()} {budget.currency}
                </label>
                <input
                  type="number"
                  min="500"
                  max="100000"
                  step="100"
                  value={budget.total}
                  onChange={(e) => updateBudget(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditBudgetOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setIsEditBudgetOpen(false)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save
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
