"use client"

import { useTripStore } from "@/store/trip-store"

export function BudgetMeter() {
  const { budget, spentBudget } = useTripStore()
  const spent = spentBudget()
  const percentage = budget ? (spent / budget.total) * 100 : 0

  if (!budget) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Budget Progress</span>
        <span className="text-sm font-semibold text-slate-900">
          {spent.toFixed(0)} / {budget.total.toLocaleString()} {budget.currency}
        </span>
      </div>
      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Remaining: {(budget.total - spent).toFixed(0)} {budget.currency}</span>
        <span>{percentage.toFixed(1)}% used</span>
      </div>
    </div>
  )
}


