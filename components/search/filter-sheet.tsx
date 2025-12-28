"use client"

import React, { useState } from 'react'
import { Sliders, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/shared/ui/sheet'
import { Button } from '@/components/shared/ui/button'
import { Slider } from '@/components/shared/ui/slider'
import { useSearchStore, type SortOption } from '@/store/search-store'
import { cn } from '@/lib/utils'

interface FilterSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  resultCount?: number
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'name_asc', label: 'Name: A to Z' },
]

const CATEGORIES = ['Hotels', 'Nature', 'Food', 'Activities']

const AMENITIES = ['Wifi', 'Pool', 'Parking', 'Breakfast', 'Spa', 'Gym']

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', color: 'bg-green-500' },
  { value: 'moderate', label: 'Moderate', color: 'bg-yellow-500' },
  { value: 'hard', label: 'Hard', color: 'bg-red-500' },
]

export function FilterSheet({
  isOpen,
  onOpenChange,
  resultCount = 0,
}: FilterSheetProps) {
  const {
    filters,
    sortBy,
    toggleFilter,
    setSortBy,
    resetFilters,
  } = useSearchStore()

  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(
    filters.priceRange
  )

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.amenities.length > 0 ||
    filters.difficulty !== null ||
    localPriceRange[0] > 0 ||
    localPriceRange[1] < 10000

  const hasNatureSelected = filters.categories.includes('Nature')
  const hasHotelSelected = filters.categories.includes('Hotels')

  const handleApplyFilters = () => {
    // Update price range in store
    useSearchStore.getState().toggleFilter('priceRange', localPriceRange)
    onOpenChange(false)
  }

  const handleReset = () => {
    resetFilters()
    setLocalPriceRange([0, 10000])
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Filters
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Sort By */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Sort By
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={cn(
                    'px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    sortBy === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Price Range
            </h3>
            <div className="space-y-4">
              <Slider
                value={[localPriceRange[0], localPriceRange[1]]}
                onValueChange={(values) =>
                  setLocalPriceRange([values[0], values[1]])
                }
                min={0}
                max={10000}
                step={100}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{localPriceRange[0]} RON</span>
                <span>{localPriceRange[1]} RON</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleFilter('categories', category)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                    filters.categories.includes(category)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic: Difficulty (for Nature) */}
          {hasNatureSelected && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Difficulty
              </h3>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleFilter('difficulty', option.value)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2',
                      filters.difficulty === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        option.color
                      )}
                    />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic: Amenities (for Hotels) */}
          {hasHotelSelected && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Amenities
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map((amenity) => (
                  <label
                    key={amenity}
                    className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.amenities.includes(amenity)}
                      onChange={() => toggleFilter('amenities', amenity)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Reset Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Footer with Apply Button */}
        <SheetFooter className="sticky bottom-0 bg-white border-t pt-4 pb-6 -mx-6 px-6">
          <Button
            onClick={handleApplyFilters}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            {resultCount > 0 ? `Show ${resultCount} Results` : 'Apply Filters'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

