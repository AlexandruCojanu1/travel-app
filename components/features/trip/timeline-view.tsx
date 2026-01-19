"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { DayNavigator } from './day-navigator'
import { TimelineItem } from './timeline-item'
import { ShareTripDialog } from './share-trip-dialog'
import { useTripStore } from '@/store/trip-store'
import { Button } from '@/components/shared/ui/button'
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
  }, [selectedDayIndex, tripDetails, dayItems.length])

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

      {/* Timeline Content - Removed Tabs */}
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
                className="py-12 text-center"
              >
                <div className="max-w-sm mx-auto">
                  <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Planul este gol
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Adaugă primele activități pentru această zi
                  </p>
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
                    daysCount={daysCount}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Constant Add Activity Button */}
          <div className="mt-4 flex justify-center pb-4">
            <Button
              className="rounded-full px-6 bg-primary hover:bg-red-600 shadow-lg shadow-primary/20 text-white border-none"
              onClick={() => {
                // Navigate to vote/swipe mode to add items
                if (tripId) {
                  window.location.href = `/plan/${tripId}/vote`
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="font-semibold">Adaugă activitate</span>
            </Button>
          </div>
        </div>
      </div>

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
