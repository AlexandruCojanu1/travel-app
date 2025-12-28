"use client"

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { cn } from '@/lib/utils'

interface DayNavigatorProps {
  selectedDayIndex: number
  onDaySelect: (index: number) => void
  daysCount?: number
}

export function DayNavigator({ 
  selectedDayIndex, 
  onDaySelect,
  daysCount = 7 
}: DayNavigatorProps) {
  const days = Array.from({ length: daysCount }, (_, i) => i)

  return (
    <div className="flex items-center gap-2 p-4 border-b border-gray-100 overflow-x-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDaySelect(Math.max(0, selectedDayIndex - 1))}
        disabled={selectedDayIndex === 0}
        className="flex-shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex gap-2 flex-1 min-w-0">
        {days.map((dayIndex) => (
          <button
            key={dayIndex}
            onClick={() => onDaySelect(dayIndex)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition-colors",
              selectedDayIndex === dayIndex
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            Day {dayIndex + 1}
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDaySelect(Math.min(daysCount - 1, selectedDayIndex + 1))}
        disabled={selectedDayIndex === daysCount - 1}
        className="flex-shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}


