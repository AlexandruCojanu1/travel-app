"use client"

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock, DollarSign, Bookmark, BookmarkCheck } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { createClient } from '@/lib/supabase/client'
import { format, isSameDay, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Event {
  id: string
  title: string
  description: string | null
  category: string | null
  start_date: string
  end_date: string
  location_name: string | null
  location_address: string | null
  price_min: number | null
  price_max: number | null
  image_url: string | null
}

interface EventCalendarProps {
  cityId: string
  selectedDate?: Date
  onEventSelect?: (event: Event) => void
}

export function EventCalendar({ cityId, selectedDate, onEventSelect }: EventCalendarProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [bookmarkedEvents, setBookmarkedEvents] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEvents()
    loadBookmarks()
  }, [cityId])

  async function loadEvents() {
    if (!cityId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/list?city_id=${cityId}&limit=100`)
      const result = await response.json()

      if (result.success) {
        setEvents(result.events || [])
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadBookmarks() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('event_bookmarks')
      .select('event_id')
      .eq('user_id', user.id)

    if (data) {
      setBookmarkedEvents(new Set(data.map(b => b.event_id)))
    }
  }

  async function toggleBookmark(eventId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please log in to bookmark events')
      return
    }

    const isBookmarked = bookmarkedEvents.has(eventId)

    if (isBookmarked) {
      const { error } = await supabase
        .from('event_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId)

      if (!error) {
        setBookmarkedEvents(prev => {
          const next = new Set(prev)
          next.delete(eventId)
          return next
        })
        toast.success('Event removed from bookmarks')
      }
    } else {
      const { error } = await supabase
        .from('event_bookmarks')
        .insert({
          user_id: user.id,
          event_id: eventId,
        })

      if (!error) {
        setBookmarkedEvents(prev => new Set(prev).add(eventId))
        toast.success('Event bookmarked!')
      }
    }
  }

  const filteredEvents = selectedDate
    ? events.filter(event => isSameDay(parseISO(event.start_date), selectedDate))
    : events

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading events...</p>
      </div>
    )
  }

  if (filteredEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No events found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filteredEvents.map((event) => (
        <div
          key={event.id}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onEventSelect?.(event)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3 mb-2">
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 truncate">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(parseISO(event.start_date), 'MMM d, yyyy • h:mm a')}
                    {event.end_date && ` - ${format(parseISO(event.end_date), 'h:mm a')}`}
                  </span>
                </div>

                {event.location_name && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location_name}</span>
                  </div>
                )}

                {(event.price_min || event.price_max) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      {event.price_min && event.price_max
                        ? `${event.price_min} - ${event.price_max} RON`
                        : event.price_min
                        ? `From ${event.price_min} RON`
                        : `Up to ${event.price_max} RON`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                toggleBookmark(event.id)
              }}
            >
              {bookmarkedEvents.has(event.id) ? (
                <BookmarkCheck className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

