"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Search, Sliders, X } from 'lucide-react'
import { useSearchStore } from '@/store/search-store'
import { FilterSheet } from './filter-sheet'
import { cn } from '@/lib/utils'

interface GlobalSearchProps {
  variant?: 'static' | 'floating'
  className?: string
  onSearch?: (query: string) => void
}

export function GlobalSearch({
  variant = 'static',
  className,
  onSearch,
}: GlobalSearchProps) {
  const { query, setQuery } = useSearchStore()
  const [localQuery, setLocalQuery] = useState(query)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== query) {
        setQuery(localQuery)
        if (onSearch) {
          onSearch(localQuery)
        }
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localQuery, query, setQuery, onSearch])

  // Sync with store
  useEffect(() => {
    setLocalQuery(query)
  }, [query])

  const handleClear = () => {
    setLocalQuery('')
    setQuery('')
    if (onSearch) {
      onSearch('')
    }
  }

  const baseClasses =
    variant === 'floating'
      ? 'fixed top-4 left-4 right-4 z-40 md:left-auto md:right-4 md:w-96'
      : 'w-full'

  return (
    <>
      <div
        className={cn(
          'relative',
          baseClasses,
          variant === 'floating' && 'shadow-lg',
          className
        )}
      >
        <div
          className={cn(
            'relative flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 shadow-sm transition-shadow',
            variant === 'floating' && 'shadow-lg',
            'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
          )}
        >
          {/* Search Icon */}
          <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />

          {/* Input */}
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search places, activities..."
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />

          {/* Clear Button */}
          {localQuery && (
            <button
              onClick={handleClear}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Filter Button */}
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
            aria-label="Open filters"
          >
            <Sliders className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filter Sheet */}
      <FilterSheet
        isOpen={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
      />
    </>
  )
}

