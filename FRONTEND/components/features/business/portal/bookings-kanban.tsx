"use client"

import { useState, useEffect, useTransition } from "react"
import { CheckCircle2, XCircle, MessageSquare, Calendar, User, Phone, Mail, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { toast } from "sonner"
import type { Booking, BookingStatus } from "@/actions/booking"
import { confirmBooking, cancelBooking } from "@/actions/booking"

interface BookingsKanbanProps {
  businessId: string
}

const STATUS_COLUMNS = [
  { id: 'pending', label: 'În așteptare', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'confirmed', label: 'Confirmate', color: 'bg-mova-light-blue border-mova-blue/30' },
  { id: 'checked_in', label: 'Check-in făcut', color: 'bg-green-50 border-green-200' },
  { id: 'completed', label: 'Finalizate', color: 'bg-mova-light-gray border-gray-200' },
  { id: 'cancelled', label: 'Anulate', color: 'bg-blue-50 border-red-200' },
] as const

export function BookingsKanban({ businessId }: BookingsKanbanProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [messageText, setMessageText] = useState("")

  useEffect(() => {
    if (businessId) {
      loadBookings()
    }
  }, [businessId])

  async function loadBookings() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('hotel_bookings')
        .select(`
          *,
          room:hotel_rooms (
            name,
            room_type,
            images
          )
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setBookings(data as Booking[])
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error('Nu s-au putut încărca rezervările')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirm(bookingId: string) {
    if (isPending) return

    startTransition(async () => {
      try {
        await confirmBooking(bookingId)
        toast.success('Rezervare confirmată!')
        await loadBookings()
      } catch (error) {
        console.error(error)
        toast.error('Eroare la confirmare')
      }
    })
  }

  async function handleCancel(bookingId: string) {
    if (isPending) return
    if (!confirm('Sigur dorești să anulezi această rezervare?')) return

    startTransition(async () => {
      try {
        await cancelBooking(bookingId, 'Anulat de business')
        toast.success('Rezervare anulată!')
        await loadBookings()
      } catch (error) {
        console.error(error)
        toast.error('Eroare la anulare')
      }
    })
  }

  async function updateStatus(bookingId: string, status: BookingStatus) {
    if (isPending) return

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('hotel_bookings')
        .update({ status })
        .eq('id', bookingId)

      if (error) {
        toast.error('Eroare la actualizare status')
        console.error(error)
      } else {
        toast.success(`Status actualizat la ${status}`)
        await loadBookings()
      }
    })
  }

  async function handleSendMessage(bookingId: string) {
    if (!messageText.trim()) return

    // TODO: Implement real messaging or email
    // For now, we update guest_notes or just simulate success
    const supabase = createClient()
    const { error } = await supabase
      .from('hotel_bookings')
      .update({ special_requests: `Note business: ${messageText} | ` }) // appending to special requests for now
      .eq('id', bookingId)

    if (!error) {
      toast.success('Mesaj adăugat la notele interne (Email integration pending)')
      setMessageText("")
      setSelectedBooking(null)
    } else {
      toast.error('Eroare la salvare mesaj')
    }
  }

  function getBookingsByStatus(columnId: string) {
    return bookings.filter(b => {
      if (columnId === 'pending') {
        // Also include payment pending
        return b.status === 'pending'
      }
      return b.status === columnId
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Rezervări și Operațiuni</h3>
          <p className="text-sm text-slate-600 mt-1">
            Gestionează rezervările, check-in-urile și comunicările cu clienții
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
            Listă
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 min-h-[600px]">
          {STATUS_COLUMNS.map((column) => {
            const columnBookings = getBookingsByStatus(column.id)
            return (
              <div key={column.id} className="flex-shrink-0 w-full md:w-auto h-full">
                <div className={cn("rounded-xl border-2 p-3 h-full bg-slate-50/50", column.color)}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">
                      {column.label}
                    </h4>
                    <span className="px-2 py-0.5 text-xs font-bold bg-white rounded-full border border-gray-200">
                      {columnBookings.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {columnBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onConfirm={() => handleConfirm(booking.id)}
                        onCancel={() => handleCancel(booking.id)}
                        onCheckIn={() => updateStatus(booking.id, 'checked_in')}
                        onCheckOut={() => updateStatus(booking.id, 'completed')}
                        onMessage={(booking) => setSelectedBooking(booking)}
                        isPending={isPending}
                      />
                    ))}
                    {columnBookings.length === 0 && (
                      <div className="text-center py-12 text-slate-400 text-sm opacity-60 font-medium">
                        0 rezervări
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Cameră</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Perioadă</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Oaspeți</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          {booking.guest_name || 'Client'}
                        </div>
                        <div className="text-sm text-slate-500">
                          {booking.guest_email || '-'}
                        </div>
                        {booking.guest_phone && (
                          <div className="text-xs text-slate-400">
                            {booking.guest_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900">
                      {booking.room?.name || 'N/A'}
                      <div className="text-xs text-slate-500 capitalize">{booking.room?.room_type}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-900">
                      <div className="text-sm">
                        {format(new Date(booking.check_in), 'MMM dd')} -{' '}
                        {format(new Date(booking.check_out), 'MMM dd')}
                      </div>
                      <div className="text-xs text-slate-500">{booking.total_nights} nopți</div>
                    </td>
                    <td className="px-6 py-4 text-slate-900">{booking.guests}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {booking.total_price} RON
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium border",
                          booking.status === 'confirmed' ? "bg-green-50 text-green-700 border-green-200" :
                            booking.status === 'cancelled' ? "bg-red-50 text-red-700 border-red-200" :
                              booking.status === 'checked_in' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                booking.status === 'completed' ? "bg-gray-100 text-gray-700 border-gray-200" :
                                  "bg-yellow-50 text-yellow-700 border-yellow-200"
                        )}
                      >
                        {booking.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {booking.status === 'pending' && (
                          <Button size="sm" onClick={() => handleConfirm(booking.id)} disabled={isPending}>Confirmă</Button>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button size="sm" onClick={() => updateStatus(booking.id, 'checked_in')} disabled={isPending}>Check-in</Button>
                        )}
                        {booking.status === 'checked_in' && (
                          <Button size="sm" onClick={() => updateStatus(booking.id, 'completed')} disabled={isPending}>Check-out</Button>
                        )}
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
              <h3 className="text-lg font-bold text-slate-900">Notă / Mesaj</h3>
              <p className="text-sm text-slate-600 mt-1">
                Booking: {selectedBooking.guest_name}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Mesaj intern sau către client
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Scrie notițe..."
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
                  Anulează
                </Button>
                <Button
                  onClick={() => handleSendMessage(selectedBooking.id)}
                  disabled={!messageText.trim()}
                >
                  Salvează Notă
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
  onConfirm: () => void
  onCancel: () => void
  onCheckIn: () => void
  onCheckOut: () => void
  onMessage: (booking: Booking) => void
  isPending: boolean
}

function BookingCard({
  booking,
  onConfirm,
  onCancel,
  onCheckIn,
  onCheckOut,
  onMessage,
  isPending,
}: BookingCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Header: Name and Price */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-bold text-slate-900 text-sm line-clamp-1">
              {booking.guest_name || 'Anonim'}
            </span>
          </div>
          {booking.guest_email && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[140px]">{booking.guest_email}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="font-bold text-blue-600 text-sm">{booking.total_price} L</div>
          <div className="text-[10px] text-slate-400 capitalize">{booking.payment_option}</div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="p-2 bg-slate-50 rounded-lg text-xs space-y-1.5 text-slate-700">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium">
            {format(new Date(booking.check_in), 'dd MMM')} - {format(new Date(booking.check_out), 'dd MMM')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Cameră: <span className="font-medium">{booking.room?.name}</span></span>
        </div>
        <div>
          {booking.rooms_count} cam • {booking.guests} pers • {booking.total_nights} nopți
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {booking.status === 'pending' && (
          <>
            <Button size="sm" variant="outline" className="h-8 text-green-600 bg-green-50 border-green-200 hover:bg-green-100" onClick={onConfirm} disabled={isPending}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-red-600 bg-red-50 border-red-200 hover:bg-red-100" onClick={onCancel} disabled={isPending}>
              <XCircle className="h-3.5 w-3.5 mr-1" /> Refuz
            </Button>
          </>
        )}

        {booking.status === 'confirmed' && (
          <Button size="sm" className="h-8 col-span-2 bg-blue-600 hover:bg-blue-700" onClick={onCheckIn} disabled={isPending}>
            Check-in Client
          </Button>
        )}

        {booking.status === 'checked_in' && (
          <Button size="sm" variant="outline" className="h-8 col-span-2 text-green-600 border-green-200" onClick={onCheckOut} disabled={isPending}>
            Check-out & Finalize
          </Button>
        )}

        {(booking.status === 'completed' || booking.status === 'cancelled') && (
          <Button size="sm" variant="ghost" className="h-8 col-span-2 text-slate-400" onClick={() => onMessage(booking)}>
            <MessageSquare className="h-3.5 w-3.5 mr-1" /> Vezi note
          </Button>
        )}
      </div>

      {/* Secondary Actions Row if active */}
      {booking.status !== 'completed' && booking.status !== 'cancelled' && (
        <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500" onClick={() => onMessage(booking)}>
          Adaugă notă / mesaj
        </Button>
      )}
    </div>
  )
}
