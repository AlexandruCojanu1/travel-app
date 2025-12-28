"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, MessageSquare, Calendar, User, Phone, Mail, Clock } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { cn } from "@/lib/utils"
import { getBusinessBookings, updateBookingStatus } from "@/actions/business-portal"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { toast } from "sonner"
import { useTransition } from "react"

interface Booking {
  id: string
  start_date: string
  end_date: string
  guest_count: number
  total_amount: number
  status: string
  created_at: string
  guest_notes?: string
  user?: {
    full_name: string
    email: string
  }
  resource?: {
    name: string
  }
}

interface BookingsKanbanProps {
  businessId: string
}

const STATUS_COLUMNS = [
  { id: 'pending', label: 'Pending', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'confirmed', label: 'Confirmed', color: 'bg-airbnb-light-red border-airbnb-red/30' },
  { id: 'checked_in', label: 'Checked-In', color: 'bg-green-50 border-green-200' },
  { id: 'completed', label: 'Completed', color: 'bg-airbnb-light-gray border-gray-200' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-red-50 border-red-200' },
] as const

export function BookingsKanban({ businessId }: BookingsKanbanProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [messageText, setMessageText] = useState("")

  useEffect(() => {
    loadBookings()
  }, [businessId])

  async function loadBookings() {
    setIsLoading(true)
    try {
      const result = await getBusinessBookings(businessId)
      if (result.success && result.bookings) {
        setBookings(result.bookings)
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStatusChange(bookingId: string, newStatus: string) {
    startTransition(async () => {
      // Map statuses
      let mappedStatus: 'confirmed' | 'cancelled' | 'awaiting_payment' = 'confirmed'
      if (newStatus === 'cancelled') {
        mappedStatus = 'cancelled'
      } else if (newStatus === 'confirmed') {
        mappedStatus = 'confirmed'
      }

      const result = await updateBookingStatus(bookingId, mappedStatus)
      if (result.success) {
        toast.success(`Booking ${newStatus === 'confirmed' ? 'confirmed' : newStatus === 'cancelled' ? 'cancelled' : 'updated'}`)
        await loadBookings()
      } else {
        toast.error(result.error || 'Failed to update booking')
      }
    })
  }

  async function handleCheckIn(bookingId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'checked_in' })
      .eq('id', bookingId)

    if (!error) {
      toast.success('Guest checked in')
      await loadBookings()
    } else {
      toast.error('Failed to check in guest')
    }
  }

  async function handleCheckOut(bookingId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', bookingId)

    if (!error) {
      toast.success('Guest checked out')
      await loadBookings()
    } else {
      toast.error('Failed to check out guest')
    }
  }

  async function handleSendMessage(bookingId: string) {
    if (!messageText.trim()) return

    const supabase = createClient()
    const { error } = await supabase
      .from('bookings')
      .update({ guest_notes: messageText })
      .eq('id', bookingId)

    if (!error) {
      toast.success('Message sent to guest')
      setMessageText("")
      setSelectedBooking(null)
      await loadBookings()
    } else {
      toast.error('Failed to send message')
    }
  }

  function getBookingsByStatus(status: string) {
    return bookings.filter(b => {
      if (status === 'pending') {
        return b.status === 'awaiting_payment' || b.status === 'pending'
      }
      return b.status === status
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-airbnb-gray">Loading bookings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-airbnb-dark">Reservations & Operations</h3>
          <p className="text-sm text-airbnb-gray mt-1">
            Manage bookings, check-ins, and guest communications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((column) => {
            const columnBookings = getBookingsByStatus(column.id)
            return (
              <div key={column.id} className="flex-shrink-0 w-full md:w-auto">
                <div className={cn("rounded-xl border-2 p-4 min-h-[600px]", column.color)}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">
                      {column.label}
                    </h4>
                    <span className="px-2 py-1 text-xs font-semibold bg-white rounded-full">
                      {columnBookings.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {columnBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onStatusChange={handleStatusChange}
                        onCheckIn={handleCheckIn}
                        onCheckOut={handleCheckOut}
                        onMessage={(booking) => setSelectedBooking(booking)}
                        isPending={isPending}
                      />
                    ))}
                    {columnBookings.length === 0 && (
                      <div className="text-center py-8 text-airbnb-gray text-sm">
                        No bookings
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          {booking.user?.full_name || 'Guest'}
                        </div>
                        <div className="text-sm text-slate-600">
                          {booking.user?.email || ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900">
                      {booking.resource?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-900">
                      <div className="text-sm">
                        {format(new Date(booking.start_date), 'MMM dd')} -{' '}
                        {format(new Date(booking.end_date), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900">{booking.guest_count}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {parseFloat(booking.total_amount.toString()).toFixed(2)} RON
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          booking.status === 'confirmed'
                            ? "bg-green-100 text-green-700"
                            : booking.status === 'cancelled'
                            ? "bg-red-100 text-red-700"
                            : booking.status === 'checked_in'
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        )}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {booking.status === 'awaiting_payment' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(booking.id, 'confirmed')}
                              disabled={isPending}
                              className="text-green-600"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(booking.id, 'cancelled')}
                              disabled={isPending}
                              className="text-red-600"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckIn(booking.id)}
                            className="text-blue-600"
                          >
                            Check-In
                          </Button>
                        )}
                        {booking.status === 'checked_in' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckOut(booking.id)}
                            className="text-green-600"
                          >
                            Check-Out
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Send Message to Guest</h3>
              <p className="text-sm text-slate-600 mt-1">
                {selectedBooking.user?.full_name || 'Guest'}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Message
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedBooking(null)
                    setMessageText("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSendMessage(selectedBooking.id)}
                  disabled={!messageText.trim()}
                >
                  Send Message
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface BookingCardProps {
  booking: Booking
  onStatusChange: (id: string, status: string) => void
  onCheckIn: (id: string) => void
  onCheckOut: (id: string) => void
  onMessage: (booking: Booking) => void
  isPending: boolean
}

function BookingCard({
  booking,
  onStatusChange,
  onCheckIn,
  onCheckOut,
  onMessage,
  isPending,
}: BookingCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Guest Info */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-slate-900 text-sm">
              {booking.user?.full_name || 'Guest'}
            </span>
          </div>
          {booking.user?.email && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Mail className="h-3 w-3" />
              {booking.user.email}
            </div>
          )}
        </div>

        {/* Resource */}
        {booking.resource?.name && (
          <div className="text-sm text-slate-600">
            <span className="font-medium">Resource:</span> {booking.resource.name}
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(booking.start_date), 'MMM dd')} -{' '}
            {format(new Date(booking.end_date), 'MMM dd')}
          </span>
        </div>

        {/* Guests & Amount */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">
            {booking.guest_count} {booking.guest_count === 1 ? 'guest' : 'guests'}
          </span>
          <span className="font-semibold text-slate-900">
            {parseFloat(booking.total_amount.toString()).toFixed(2)} RON
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
          {booking.status === 'awaiting_payment' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange(booking.id, 'confirmed')}
                disabled={isPending}
                className="w-full text-green-600 hover:text-green-700"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange(booking.id, 'cancelled')}
                disabled={isPending}
                className="w-full text-red-600 hover:text-red-700"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </>
          )}
          {booking.status === 'confirmed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCheckIn(booking.id)}
              className="w-full text-blue-600 hover:text-blue-700"
            >
              <Clock className="h-3 w-3 mr-1" />
              Check-In
            </Button>
          )}
          {booking.status === 'checked_in' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCheckOut(booking.id)}
              className="w-full text-green-600 hover:text-green-700"
            >
              Check-Out
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMessage(booking)}
            className="w-full"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Message
          </Button>
        </div>
      </div>
    </div>
  )
}

