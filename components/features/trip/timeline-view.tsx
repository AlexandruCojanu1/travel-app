"use client"

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Plus, Map, Share2 } from 'lucide-react'
import { DayNavigator } from './day-navigator'
import { TimelineItem } from './timeline-item'
import { RouteMapView } from './route-map-view'
import { ShareTripDialog } from './share-trip-dialog'
import { useTripStore } from '@/store/trip-store'
import { Button } from '@/components/shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs'
import type { TripItem } from '@/store/trip-store'

export function TimelineView() {
  const { tripDetails, tripId, getItemsByDay, getDaysCount, reorderItems } = useTripStore()
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [localItems, setLocalItems] = useState<TripItem[]>([])
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

  // Calculate dayItems and daysCount - use empty array if no tripDetails
  const dayItems = tripDetails ? getItemsByDay(selectedDayIndex) : []
  const daysCount = tripDetails ? getDaysCount() : 0

  // Sync local items with store items when day changes
  React.useEffect(() => {
    if (tripDetails) {
      setLocalItems(dayItems)
    }
  }, [selectedDayIndex, dayItems.length, tripDetails, dayItems])

  // Sync when store items change
  React.useEffect(() => {
    if (tripDetails) {
      setLocalItems(dayItems)
    }
  }, [dayItems, tripDetails])

  if (!tripDetails) {
    return null
  }

  const handleItemDrag = (itemId: string, y: number) => {
    const itemIndex = localItems.findIndex((item) => item.id === itemId)
    if (itemIndex === -1) return

    // Calculate new index based on drag position
    // Each item is approximately 120px tall (card + padding)
    const itemHeight = 120
    const threshold = itemHeight / 2 // Swap when crossing halfway point
    
    // Determine direction and calculate new index
    let newIndex = itemIndex
    if (y > threshold && itemIndex < localItems.length - 1) {
      // Dragging down - move to next position
      newIndex = itemIndex + 1
    } else if (y < -threshold && itemIndex > 0) {
      // Dragging up - move to previous position
      newIndex = itemIndex - 1
    }

    // Only reorder if index actually changed
    if (newIndex !== itemIndex && newIndex >= 0 && newIndex < localItems.length) {
      const newItems = [...localItems]
      const [removed] = newItems.splice(itemIndex, 1)
      newItems.splice(newIndex, 0, removed)
      setLocalItems(newItems)
    }
  }

  const handleItemDragEnd = (itemId: string) => {
    setDraggedItemId(null)
    // Sync with store
    const newItemIds = localItems.map((i) => i.id)
    reorderItems(selectedDayIndex, newItemIds)
  }

  return (
    <div className="space-y-6">
      {/* Day Navigator */}
      <DayNavigator
        selectedDayIndex={selectedDayIndex}
        onDaySelect={setSelectedDayIndex}
        daysCount={daysCount}
      />

      {/* Route Map and Timeline Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Route Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-4">
          <RouteMapView dayIndex={selectedDayIndex} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          {/* Timeline Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
        <AnimatePresence mode="wait">
          {dayItems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center"
            >
              <div className="max-w-sm mx-auto">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Plan is empty for this day
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Start building your itinerary by adding activities and places
                </p>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 mx-auto"
                  onClick={() => {
                    // Navigate to explore page to add items
                    window.location.href = '/explore'
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Activity
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`day-${selectedDayIndex}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-0"
            >
              {localItems.map((item, index) => (
                <TimelineItem
                  key={item.id}
                  item={item}
                  index={index}
                  isLast={index === localItems.length - 1}
                  totalItems={localItems.length}
                  isDragging={draggedItemId === item.id}
                  onDragStart={() => setDraggedItemId(item.id)}
                  onDragEnd={() => handleItemDragEnd(item.id)}
                  onDrag={(y) => handleItemDrag(item.id, y)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {tripId && (
        <ShareTripDialog
          isOpen={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          tripId={tripId}
        />
      )}
    </div>
  )
}

