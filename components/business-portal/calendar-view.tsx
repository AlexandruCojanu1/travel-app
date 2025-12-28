"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight, Lock, DollarSign, Calendar as CalendarIcon, Grid, List, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, isPast } from "date-fns"
import { toast } from "sonner"
import { BlockDateDialog } from "./block-date-dialog"
import { PriceAdjustmentDialog } from "./price-adjustment-dialog"

interface CalendarViewProps {
  businessId: string
  resourceId?: string // Optional: if provided, shows calendar for specific resource
}

type ViewMode = 'month' | 'week' | 'day'

interface AvailabilityData {
  date: string // YYYY-MM-DD
  is_available: boolean
  units_available: number
  price_override?: number | null
  reason?: string
  notes?: string
}

interface BookingData {
  date: string
  count: number
}

export function CalendarView({ businessId, resourceId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [availability, setAvailability] = useState<Map<string, AvailabilityData>>(new Map())
  const [bookings, setBookings] = useState<Map<string, BookingData>>(new Map())
  const [resources, setResources] = useState<any[]>([])
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(resourceId || null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null)

  useEffect(() => {
    loadResources()
  }, [businessId])

  useEffect(() => {
    if (selectedResourceId) {
      loadAvailability()
      loadBookings()
    }
  }, [selectedResourceId, currentDate])

  async function loadResources() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('business_resources')
      .select('id, name, resource_type, base_price')
      .eq('business_id', businessId)
      .in('resource_type', ['room', 'service'])
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (data) {
      setResources(data)
      if (data.length > 0 && !selectedResourceId) {
        setSelectedResourceId(data[0].id)
      }
    }
    setIsLoading(false)
  }

  async function loadAvailability() {
    if (!selectedResourceId) return

    const supabase = createClient()
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)

    const { data, error } = await supabase
      .from('resource_availability')
      .select('*')
      .eq('resource_id', selectedResourceId)
      .gte('date', format(monthStart, 'yyyy-MM-dd'))
      .lte('date', format(monthEnd, 'yyyy-MM-dd'))

    if (data) {
      const availabilityMap = new Map<string, AvailabilityData>()
      data.forEach((item: any) => {
        availabilityMap.set(item.date, {
          date: item.date,
          is_available: item.is_available !== false,
          units_available: item.units_available || 0,
          price_override: item.price_override,
          reason: item.reason,
          notes: item.notes,
        })
      })
      setAvailability(availabilityMap)
    }
  }

  async function loadBookings() {
    if (!selectedResourceId) return

    const supabase = createClient()
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)

    const { data, error } = await supabase
      .from('bookings')
      .select('start_date, end_date, status')
      .eq('resource_id', selectedResourceId)
      .in('status', ['confirmed', 'checked_in'])
      .gte('start_date', format(monthStart, 'yyyy-MM-dd'))
      .lte('end_date', format(monthEnd, 'yyyy-MM-dd'))

    if (data) {
      const bookingsMap = new Map<string, BookingData>()
      data.forEach((booking: any) => {
        const start = new Date(booking.start_date)
        const end = new Date(booking.end_date)
        const dates = eachDayOfInterval({ start, end })
        
        dates.forEach(date => {
          const dateStr = format(date, 'yyyy-MM-dd')
          const current = bookingsMap.get(dateStr) || { date: dateStr, count: 0 }
          bookingsMap.set(dateStr, { ...current, count: current.count + 1 })
        })
      })
      setBookings(bookingsMap)
    }
  }

  async function handleBlockDate(date: Date, reason: string, notes?: string) {
    if (!selectedResourceId) return

    const supabase = createClient()
    const dateStr = format(date, 'yyyy-MM-dd')

    // Check if record exists
    const { data: existing } = await supabase
      .from('resource_availability')
      .select('id')
      .eq('resource_id', selectedResourceId)
      .eq('date', dateStr)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('resource_availability')
        .update({
          is_available: false,
          units_available: 0,
          reason,
          notes,
        })
        .eq('id', existing.id)
      
      if (!error) {
        toast.success('Date blocked successfully')
        await loadAvailability()
      } else {
        toast.error('Failed to block date')
      }
    } else {
      // Get resource to get default units
      const { data: resource } = await supabase
        .from('business_resources')
        .select('*')
        .eq('id', selectedResourceId)
        .single()

      const { error } = await supabase
        .from('resource_availability')
        .insert({
          resource_id: selectedResourceId,
          date: dateStr,
          is_available: false,
          units_available: 0,
          reason,
          notes,
        })

      if (!error) {
        toast.success('Date blocked successfully')
        await loadAvailability()
      } else {
        toast.error('Failed to block date')
      }
    }
  }

  async function handleUnblockDate(date: Date) {
    if (!selectedResourceId) return

    const supabase = createClient()
    const dateStr = format(date, 'yyyy-MM-dd')

    const { error } = await supabase
      .from('resource_availability')
      .update({
        is_available: true,
        units_available: 1, // Default, should be set based on resource capacity
        reason: null,
        notes: null,
      })
      .eq('resource_id', selectedResourceId)
      .eq('date', dateStr)

    if (!error) {
      toast.success('Date unblocked successfully')
      await loadAvailability()
    } else {
      toast.error('Failed to unblock date')
    }
  }

  async function handlePriceAdjustment(date: Date, price: number | null, percentage?: number) {
    if (!selectedResourceId) return

    const supabase = createClient()
    const dateStr = format(date, 'yyyy-MM-dd')

    // Get resource base price
    const { data: resource } = await supabase
      .from('business_resources')
      .select('base_price')
      .eq('id', selectedResourceId)
      .single()

    const basePrice = resource?.base_price || 0
    const finalPrice = percentage !== undefined
      ? basePrice * (1 + percentage / 100)
      : price || basePrice

    // Check if record exists
    const { data: existing } = await supabase
      .from('resource_availability')
      .select('id')
      .eq('resource_id', selectedResourceId)
      .eq('date', dateStr)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('resource_availability')
        .update({ price_override: finalPrice })
        .eq('id', existing.id)

      if (!error) {
        toast.success('Price updated successfully')
        await loadAvailability()
      } else {
        toast.error('Failed to update price')
      }
    } else {
      const { error } = await supabase
        .from('resource_availability')
        .insert({
          resource_id: selectedResourceId,
          date: dateStr,
          is_available: true,
          units_available: 1,
          price_override: finalPrice,
        })

      if (!error) {
        toast.success('Price set successfully')
        await loadAvailability()
      } else {
        toast.error('Failed to set price')
      }
    }
  }

  function getDateStatus(date: Date): 'available' | 'low' | 'blocked' | 'past' {
    if (isPast(date) && !isToday(date)) return 'past'
    
    const dateStr = format(date, 'yyyy-MM-dd')
    const avail = availability.get(dateStr)
    const booking = bookings.get(dateStr)

    if (!avail || avail.is_available === false) return 'blocked'
    if (avail.units_available <= 0) return 'blocked'
    if (avail.units_available <= 2 || (booking && booking.count > 0)) return 'low'
    return 'available'
  }

  function getDateColor(date: Date): string {
    const status = getDateStatus(date)
    switch (status) {
      case 'available':
        return 'bg-green-100 hover:bg-green-200 border-green-300'
      case 'low':
        return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300'
      case 'blocked':
        return 'bg-red-100 hover:bg-red-200 border-red-300'
      case 'past':
        return 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
      default:
        return 'bg-white hover:bg-slate-50 border-slate-200'
    }
  }

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentDate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600">Loading calendar...</div>
      </div>
    )
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
        <CalendarIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 mb-4">No resources available</p>
        <p className="text-sm text-slate-500">Create rooms or services first to manage availability</p>
      </div>
    )
  }

  const selectedResource = resources.find(r => r.id === selectedResourceId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Availability Calendar</h3>
          <p className="text-sm text-slate-600 mt-1">
            Manage availability, block dates, and adjust prices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            <Grid className="h-4 w-4 mr-1" />
            Month
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            <List className="h-4 w-4 mr-1" />
            Week
          </Button>
        </div>
      </div>

      {/* Resource Selector */}
      {resources.length > 1 && (
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Resource
          </label>
          <select
            value={selectedResourceId || ''}
            onChange={(e) => setSelectedResourceId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500"
          >
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name} ({resource.resource_type})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h4 className="text-lg font-semibold text-slate-900">
            {format(currentDate, 'MMMM yyyy')}
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((date, index) => {
              const isCurrentMonth = isSameMonth(date, currentDate)
              const status = getDateStatus(date)
              const dateStr = format(date, 'yyyy-MM-dd')
              const avail = availability.get(dateStr)
              const booking = bookings.get(dateStr)
              const isSelected = selectedDate && isSameDay(date, selectedDate)

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (status !== 'past') {
                      setSelectedDate(date)
                      setSelectedDateRange({ start: date, end: date })
                    }
                  }}
                  disabled={status === 'past'}
                  className={cn(
                    "relative p-2 rounded-lg border-2 transition-all text-left min-h-[80px]",
                    getDateColor(date),
                    !isCurrentMonth && "opacity-30",
                    isSelected && "ring-2 ring-blue-500 ring-offset-2",
                    status !== 'past' && "cursor-pointer"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-sm font-semibold",
                      isToday(date) && "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center",
                      !isToday(date) && "text-slate-900"
                    )}>
                      {format(date, 'd')}
                    </span>
                    {avail?.price_override && (
                      <DollarSign className="h-3 w-3 text-blue-600" />
                    )}
                    {status === 'blocked' && (
                      <Lock className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                  
                  {booking && booking.count > 0 && (
                    <div className="text-xs text-slate-600 mt-1">
                      {booking.count} {booking.count === 1 ? 'booking' : 'bookings'}
                    </div>
                  )}
                  
                  {avail && (
                    <div className="text-xs text-slate-600 mt-1">
                      {avail.units_available} {avail.units_available === 1 ? 'unit' : 'units'}
                    </div>
                  )}

                  {avail?.price_override && (
                    <div className="text-xs font-semibold text-blue-600 mt-1">
                      {avail.price_override.toFixed(0)} RON
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
              <span className="text-slate-700">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
              <span className="text-slate-700">Low Availability</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
              <span className="text-slate-700">Blocked / Fully Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200 opacity-50" />
              <span className="text-slate-700">Past Dates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {selectedDate && (
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-4">
            Actions for {format(selectedDate, 'MMMM dd, yyyy')}
          </h4>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const avail = availability.get(format(selectedDate, 'yyyy-MM-dd'))
                if (avail && !avail.is_available) {
                  handleUnblockDate(selectedDate)
                } else {
                  setIsBlockDialogOpen(true)
                }
              }}
            >
              <Lock className="h-4 w-4 mr-2" />
              {availability.get(format(selectedDate, 'yyyy-MM-dd'))?.is_available === false
                ? 'Unblock Date'
                : 'Block Date'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsPriceDialogOpen(true)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Adjust Price
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Bulk action: Set weekend price
                const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6
                if (isWeekend) {
                  handlePriceAdjustment(selectedDate, null, 20) // +20%
                  toast.success('Weekend price set (+20%)')
                } else {
                  toast.info('Selected date is not a weekend')
                }
              }}
            >
              Set Weekend Price (+20%)
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <BlockDateDialog
        isOpen={isBlockDialogOpen}
        onClose={() => setIsBlockDialogOpen(false)}
        onBlock={handleBlockDate}
        date={selectedDate}
      />

      <PriceAdjustmentDialog
        isOpen={isPriceDialogOpen}
        onClose={() => setIsPriceDialogOpen(false)}
        onSave={handlePriceAdjustment}
        date={selectedDate}
        currentPrice={selectedResource?.base_price || 0}
        overridePrice={selectedDate ? availability.get(format(selectedDate, 'yyyy-MM-dd'))?.price_override : null}
      />
    </div>
  )
}

