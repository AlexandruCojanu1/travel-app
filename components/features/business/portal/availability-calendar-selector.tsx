"use client"

import { CalendarView } from "./calendar-view"

interface AvailabilityCalendarSelectorProps {
  businessId?: string
}

export function AvailabilityCalendarSelector({ businessId }: AvailabilityCalendarSelectorProps) {
  if (!businessId) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Please select a business to view availability</p>
      </div>
    )
  }

  return <CalendarView businessId={businessId} />
}

